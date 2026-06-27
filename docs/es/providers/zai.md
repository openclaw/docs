---
read_when:
    - Quieres modelos Z.AI / GLM en OpenClaw
    - Necesitas una configuración sencilla de ZAI_API_KEY
summary: Usa Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T12:46:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI es la plataforma de API para los modelos **GLM**. Proporciona API REST para GLM y
usa claves de API para la autenticación. Crea tu clave de API en la consola de Z.AI.
OpenClaw usa el proveedor `zai` con una clave de API de Z.AI.

| Propiedad | Valor                                        |
| -------- | -------------------------------------------- |
| Proveedor | `zai`                                        |
| Paquete  | `@openclaw/zai-provider`                     |
| Autenticación     | `ZAI_API_KEY` (alias heredado: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (autenticación Bearer)          |

## Modelos GLM

GLM es una familia de modelos, no un proveedor independiente. En OpenClaw, los modelos GLM usan
refs como `zai/glm-5.2`: proveedor `zai`, id de modelo `glm-5.2`.

## Primeros pasos

Instala primero el Plugin del proveedor:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Detectar endpoint automáticamente">
    **Ideal para:** la mayoría de los usuarios. OpenClaw sondea los endpoints de Z.AI compatibles con tu clave de API y aplica automáticamente la URL base correcta.

    <Steps>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verificar que el modelo aparece en la lista">
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
      <Step title="Verificar que el modelo aparece en la lista">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ejemplo de configuración

<Tip>
`zai-api-key` permite que OpenClaw detecte el endpoint de Z.AI correspondiente a partir de la clave y
aplique automáticamente la URL base correcta. Usa las opciones regionales explícitas cuando
quieras forzar un Coding Plan específico o una superficie de API general.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Catálogo integrado

El Plugin del proveedor `zai` incluye su catálogo en el manifiesto del Plugin, por lo que el listado de solo lectura
puede mostrar filas GLM conocidas sin cargar el runtime del proveedor:

```bash
openclaw models list --all --provider zai
```

El catálogo respaldado por el manifiesto incluye actualmente:

| Ref de modelo            | Notas                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Valor predeterminado de Coding Plan; contexto de 1M |
| `zai/glm-5.1`        | Valor predeterminado de la API general             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
Los modelos GLM están disponibles como `zai/<model>` (ejemplo: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 admite los niveles de razonamiento `off`, `low`, `high` y `max`. OpenClaw asigna
`low` y `high` al esfuerzo de razonamiento alto de Z.AI, y `max` al esfuerzo máximo.
</Tip>

<Note>
La configuración de Coding Plan usa `zai/glm-5.2` de forma predeterminada; la configuración de la API general mantiene
`zai/glm-5.1`. La detección automática de endpoints recurre a `glm-5.1` o `glm-4.7`
cuando el plan seleccionado no expone GLM-5.2. Las versiones y la disponibilidad de GLM
pueden cambiar; ejecuta `openclaw models list --all --provider zai` para ver el catálogo
conocido por tu versión instalada.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Resolución futura de modelos GLM-5 desconocidos">
    Los ids `glm-5*` desconocidos siguen resolviéndose hacia adelante en la ruta del proveedor mediante la
    sintetización de metadatos propiedad del proveedor a partir de la plantilla `glm-4.7` cuando el id
    coincide con la forma actual de la familia GLM-5.
  </Accordion>

  <Accordion title="Transmisión en streaming de llamadas a herramientas">
    `tool_stream` está habilitado de forma predeterminada para la transmisión en streaming de llamadas a herramientas de Z.AI. Para deshabilitarlo:

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

  <Accordion title="Razonamiento y razonamiento preservado">
    El razonamiento de Z.AI sigue los controles `/think` de OpenClaw. Con el razonamiento desactivado,
    OpenClaw envía `thinking: { type: "disabled" }` para evitar respuestas que
    gasten el presupuesto de salida en `reasoning_content` antes del texto visible.

    El razonamiento preservado es opcional porque Z.AI requiere reproducir todo el
    `reasoning_content` histórico, lo que aumenta los tokens del prompt. Habilítalo
    por modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Cuando está habilitado y el razonamiento está activado, OpenClaw envía
    `thinking: { type: "enabled", clear_thinking: false }` y reproduce el
    `reasoning_content` anterior para la misma transcripción compatible con OpenAI.

    Los usuarios avanzados aún pueden anular la carga útil exacta del proveedor con
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El Plugin de Z.AI registra comprensión de imágenes.

    | Propiedad      | Valor       |
    | ------------- | ----------- |
    | Modelo         | `glm-4.6v`  |

    La comprensión de imágenes se resuelve automáticamente a partir de la autenticación de Z.AI configurada; no
    se necesita configuración adicional.

  </Accordion>

  <Accordion title="Detalles de autenticación">
    - Z.AI usa autenticación Bearer con tu clave de API.
    - La opción de onboarding `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente sondeando los endpoints compatibles con tu clave.
    - Usa las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) cuando quieras forzar una superficie de API específica.
    - La variable de entorno heredada `Z_AI_API_KEY` todavía se acepta; OpenClaw la copia a `ZAI_API_KEY` al iniciar si `ZAI_API_KEY` no está definida.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración de OpenClaw, incluida la configuración de proveedores y modelos.
  </Card>
</CardGroup>
