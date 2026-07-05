---
read_when:
    - Quiere usar modelos de Z.AI / GLM en OpenClaw
    - Necesitas una configuración simple de ZAI_API_KEY
summary: Usar Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-05T11:40:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI es la plataforma API para los modelos **GLM**. Proporciona API REST para GLM y
usa claves de API para la autenticación. Crea tu clave de API en la consola de Z.AI.
OpenClaw usa el proveedor `zai` con una clave de API de Z.AI.

| Propiedad | Valor                                        |
| -------- | -------------------------------------------- |
| Proveedor | `zai`                                        |
| Paquete  | `@openclaw/zai-provider`                     |
| Autenticación     | `ZAI_API_KEY` (alias heredado: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (autenticación Bearer)          |

## Modelos GLM

GLM es una familia de modelos, no un proveedor separado. En OpenClaw, los modelos GLM usan
referencias como `zai/glm-5.2`: proveedor `zai`, id de modelo `glm-5.2`.

## Primeros pasos

Instala primero el Plugin de proveedor:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Detectar endpoint automáticamente">
    **Ideal para:** la mayoría de usuarios. OpenClaw prueba los endpoints de Z.AI compatibles con tu clave de API y aplica automáticamente la URL base correcta.

    <Steps>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verificar que el modelo aparezca en la lista">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Ideal para:** usuarios que quieren forzar un Coding Plan específico o una superficie de API general.

    <Steps>
      <Step title="Elegir la opción de onboarding adecuada">
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
      <Step title="Verificar que el modelo aparezca en la lista">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Endpoints

| Opción de onboarding   | URL base                                      | Modelo predeterminado |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` detecta automáticamente una de estas cuatro opciones probando tu clave con la API de chat completions de cada
endpoint, revisando los endpoints generales (`zai-global`,
luego `zai-cn`) antes que los endpoints de Coding Plan (`zai-coding-global`, luego
`zai-coding-cn`), y deteniéndose en el primer endpoint que acepta una solicitud.
Usa un `--auth-choice` explícito para forzar un endpoint de Coding Plan si tu clave
funciona en ambos.

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

El Plugin de proveedor `zai` incluye su catálogo en el manifiesto del Plugin, por lo que el listado de solo lectura
puede mostrar filas GLM conocidas sin cargar el runtime del proveedor:

```bash
openclaw models list --all --provider zai
```

El catálogo respaldado por el manifiesto incluye actualmente:

| Ref. de modelo            | Notas                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Predeterminado de Coding Plan; contexto 1M |
| `zai/glm-5.1`        | Predeterminado de API general             |
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

<Note>
La configuración de Coding Plan usa `zai/glm-5.2` de forma predeterminada; la configuración de API general conserva
`zai/glm-5.1`. En los endpoints de Coding Plan, la detección automática recurre a
`glm-5.1` y luego a `glm-4.7` cuando la clave o el plan no expone GLM-5.2. Las versiones y la disponibilidad de GLM
pueden cambiar; ejecuta `openclaw models list --all --provider zai`
para ver el catálogo conocido por tu versión instalada.
</Note>

## Niveles de razonamiento

<Tabs>
  <Tab title="GLM-5.2">
    Rango completo: `off`, `low`, `high`, `max` (`off` por defecto). OpenClaw asigna
    `low` y `high` al esfuerzo de razonamiento `high` de Z.AI, y `max` al esfuerzo
    `max` de Z.AI, mediante `reasoning_effort` en la carga útil de la solicitud.
  </Tab>
  <Tab title="Otros modelos GLM">
    Solo conmutador binario: `off` y `low` (se muestra como `on` en los selectores), por defecto
    `off`. Configurar el razonamiento como `off` envía `thinking: { type: "disabled" }`;
    cualquier otro nivel deja intacta la carga útil de la solicitud (se aplica el comportamiento de razonamiento predeterminado de Z.AI).
  </Tab>
</Tabs>

Configurar el razonamiento como `off` evita respuestas que gastan el presupuesto de salida en
`reasoning_content` antes del texto visible.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Resolución hacia adelante de modelos GLM-5 desconocidos">
    Los ids `glm-5*` desconocidos siguen resolviéndose hacia adelante en la ruta del proveedor mediante la
    síntesis de metadatos propiedad del proveedor a partir de la plantilla `glm-4.7` cuando el id
    coincide con la forma actual de la familia GLM-5.
  </Accordion>

  <Accordion title="Streaming de llamadas a herramientas">
    `tool_stream` está habilitado por defecto para el streaming de llamadas a herramientas de Z.AI. Para deshabilitarlo:

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

  <Accordion title="Razonamiento conservado">
    El razonamiento conservado es opcional porque Z.AI requiere que se reproduzca el
    `reasoning_content` histórico completo, lo que aumenta los tokens del prompt. Habilítalo
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
    `reasoning_content` anterior para la misma transcripción compatible con OpenAI. La clave de parámetro snake_case
    `preserve_thinking` funciona como alias.

    Los usuarios avanzados aún pueden anular la carga útil exacta del proveedor con
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El Plugin de Z.AI registra comprensión de imágenes.

    | Propiedad      | Valor       |
    | ------------- | ----------- |
    | Modelo         | `glm-4.6v`  |

    La comprensión de imágenes se resuelve automáticamente desde la autenticación configurada de Z.AI; no se
    necesita configuración adicional.

  </Accordion>

  <Accordion title="Detalles de autenticación">
    - Z.AI usa autenticación Bearer con tu clave de API.
    - La opción de onboarding `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente probando los endpoints compatibles con tu clave.
    - Usa las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) cuando quieras forzar una superficie de API específica.
    - La variable de entorno heredada `Z_AI_API_KEY` sigue aceptándose; OpenClaw la copia a `ZAI_API_KEY` al inicio si `ZAI_API_KEY` no está definida.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración de OpenClaw, incluidos los ajustes de proveedor y modelo.
  </Card>
</CardGroup>
