---
read_when:
    - Quieres usar modelos de Z.AI / GLM en OpenClaw
    - Necesitas una configuración sencilla de ZAI_API_KEY
summary: Usar Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T05:35:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI es la plataforma de API para modelos **GLM**. Proporciona API REST para GLM y usa claves de API
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
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verificar que el modelo esté listado">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Ideal para:** usuarios que quieren forzar un Coding Plan específico o una superficie de API general.

    <Steps>
      <Step title="Elegir la opción de onboarding correcta">
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
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verificar que el modelo esté listado">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catálogo integrado

OpenClaw incluye el catálogo del proveedor `zai` en el manifiesto del Plugin, por lo que el listado
de solo lectura puede mostrar filas GLM conocidas sin cargar el runtime del proveedor:

```bash
openclaw models list --all --provider zai
```

El catálogo respaldado por el manifiesto incluye actualmente:

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
Los modelos GLM están disponibles como `zai/<model>` (ejemplo: `zai/glm-5`). La referencia de modelo incluida predeterminada es `zai/glm-5.1`.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Resolución futura de modelos GLM-5 desconocidos">
    Los ids `glm-5*` desconocidos aún se resuelven hacia delante en la ruta del proveedor incluido
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

  <Accordion title="Pensamiento y pensamiento preservado">
    El pensamiento de Z.AI sigue los controles `/think` de OpenClaw. Con el pensamiento desactivado,
    OpenClaw envía `thinking: { type: "disabled" }` para evitar respuestas que
    gasten el presupuesto de salida en `reasoning_content` antes del texto visible.

    El pensamiento preservado es opcional porque Z.AI requiere que se reproduzca todo el
    `reasoning_content` histórico, lo que aumenta los tokens del prompt. Habilítalo
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
    `thinking: { type: "enabled", clear_thinking: false }` y reproduce el
    `reasoning_content` previo para la misma transcripción compatible con OpenAI.

    Los usuarios avanzados aún pueden anular el payload exacto del proveedor con
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El Plugin de Z.AI incluido registra la comprensión de imágenes.

    | Propiedad | Valor      |
    | --------- | ---------- |
    | Modelo    | `glm-4.6v` |

    La comprensión de imágenes se resuelve automáticamente desde la autenticación de Z.AI configurada; no
    se necesita configuración adicional.

  </Accordion>

  <Accordion title="Detalles de autenticación">
    - Z.AI usa autenticación Bearer con tu clave de API.
    - La opción de onboarding `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente a partir del prefijo de la clave.
    - Usa las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) cuando quieras forzar una superficie de API específica.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Familia de modelos GLM" href="/es/providers/glm" icon="microchip">
    Descripción general de la familia de modelos GLM.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
</CardGroup>
