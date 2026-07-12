---
read_when:
    - Quieres usar modelos Z.AI / GLM en OpenClaw
    - Necesitas una configuración sencilla de ZAI_API_KEY
summary: Usar Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-11T23:29:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI es la plataforma de API para los modelos **GLM**. Proporciona API REST para GLM y
utiliza claves de API para la autenticación. Cree su clave de API en la consola de Z.AI.
OpenClaw utiliza el proveedor `zai` con una clave de API de Z.AI.

| Propiedad | Valor                                        |
| --------- | -------------------------------------------- |
| Proveedor | `zai`                                        |
| Paquete   | `@openclaw/zai-provider`                     |
| Autenticación | `ZAI_API_KEY` (alias heredado: `Z_AI_API_KEY`) |
| API       | Finalizaciones de chat de Z.AI (autenticación Bearer) |

## Modelos GLM

GLM es una familia de modelos, no un proveedor independiente. En OpenClaw, los modelos GLM utilizan
referencias como `zai/glm-5.2`: proveedor `zai`, identificador de modelo `glm-5.2`.

## Primeros pasos

Instale primero el Plugin del proveedor:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Detección automática del endpoint">
    **Recomendado para:** la mayoría de los usuarios. OpenClaw prueba los endpoints compatibles de Z.AI con su clave de API y aplica automáticamente la URL base correcta.

    <Steps>
      <Step title="Ejecutar la incorporación">
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
    **Recomendado para:** usuarios que deseen forzar un Coding Plan específico o la API general.

    <Steps>
      <Step title="Elegir la opción de incorporación correcta">
        ```bash
        # Coding Plan global (recomendado para usuarios de Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan de China (región de China)
        openclaw onboard --auth-choice zai-coding-cn

        # API general
        openclaw onboard --auth-choice zai-global

        # API general de China (región de China)
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

### Endpoints

| Opción de incorporación | URL base                                      | Modelo predeterminado |
| ----------------------- | --------------------------------------------- | --------------------- |
| `zai-global`            | `https://api.z.ai/api/paas/v4`                | `glm-5.1`             |
| `zai-cn`                | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`             |
| `zai-coding-global`     | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`             |
| `zai-coding-cn`         | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`             |

`zai-api-key` detecta automáticamente uno de estos cuatro endpoints probando su clave con la
API de finalizaciones de chat de cada endpoint. Comprueba primero los endpoints generales
(`zai-global`, seguido de `zai-cn`) y después los endpoints de Coding Plan
(`zai-coding-global`, seguido de `zai-coding-cn`), y se detiene en el primer endpoint
que acepta una solicitud. Utilice una opción `--auth-choice` explícita para forzar un
endpoint de Coding Plan si su clave funciona en ambos.

## Ejemplo de configuración

<Tip>
`zai-api-key` permite que OpenClaw detecte mediante la clave el endpoint de Z.AI correspondiente y
aplique automáticamente la URL base correcta. Utilice las opciones regionales explícitas cuando
desee forzar un Coding Plan específico o la API general.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 utiliza el endpoint de Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Catálogo integrado

El Plugin del proveedor `zai` incluye su catálogo en el manifiesto del Plugin, por lo que el listado
de solo lectura puede mostrar las filas de GLM conocidas sin cargar el entorno de ejecución del proveedor:

```bash
openclaw models list --all --provider zai
```

El catálogo respaldado por el manifiesto incluye actualmente:

| Referencia del modelo   | Notas                              |
| ----------------------- | ---------------------------------- |
| `zai/glm-5.2`           | Predeterminado de Coding Plan; contexto de 1 M |
| `zai/glm-5.1`           | Predeterminado de la API general   |
| `zai/glm-5`             |                                    |
| `zai/glm-5-turbo`       |                                    |
| `zai/glm-5v-turbo`      |                                    |
| `zai/glm-4.7`           |                                    |
| `zai/glm-4.7-flash`     |                                    |
| `zai/glm-4.7-flashx`    |                                    |
| `zai/glm-4.6`           |                                    |
| `zai/glm-4.6v`          |                                    |
| `zai/glm-4.5`           |                                    |
| `zai/glm-4.5-air`       |                                    |
| `zai/glm-4.5-flash`     |                                    |
| `zai/glm-4.5v`          |                                    |

<Tip>
Los modelos GLM están disponibles como `zai/<model>` (ejemplo: `zai/glm-5`).
</Tip>

<Note>
La configuración de Coding Plan utiliza `zai/glm-5.2` de forma predeterminada; la configuración de la
API general mantiene `zai/glm-5.1`. En los endpoints de Coding Plan, la detección automática recurre
a `glm-5.1` y después a `glm-4.7` cuando la clave o el plan no permiten acceder a GLM-5.2. Las versiones
y la disponibilidad de GLM pueden cambiar; ejecute `openclaw models list --all --provider zai`
para consultar el catálogo conocido por la versión instalada.
</Note>

## Niveles de razonamiento

<Tabs>
  <Tab title="GLM-5.2">
    Intervalo completo: `off`, `low`, `high`, `max` (valor predeterminado: `off`). OpenClaw asigna
    `low` y `high` al esfuerzo de razonamiento `high` de Z.AI, y `max` al esfuerzo
    `max` de Z.AI, mediante `reasoning_effort` en la carga útil de la solicitud.
  </Tab>
  <Tab title="Otros modelos GLM">
    Solo conmutación binaria: `off` y `low` (se muestra como `on` en los selectores); el valor
    predeterminado es `off`. Establecer el razonamiento en `off` envía `thinking: { type: "disabled" }`;
    cualquier otro nivel deja intacta la carga útil de la solicitud (se aplica el comportamiento
    de razonamiento predeterminado de Z.AI).
  </Tab>
</Tabs>

Establecer el razonamiento en `off` evita respuestas que consuman el presupuesto de salida en
`reasoning_content` antes del texto visible.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Resolución anticipada de modelos GLM-5 desconocidos">
    Los identificadores `glm-5*` desconocidos también se resuelven de forma anticipada en la ruta del
    proveedor mediante la síntesis de metadatos propiedad del proveedor a partir de la plantilla
    `glm-4.7` cuando el identificador coincide con la estructura actual de la familia GLM-5.
  </Accordion>

  <Accordion title="Transmisión de llamadas a herramientas">
    `tool_stream` está activado de forma predeterminada para la transmisión de llamadas a herramientas de Z.AI. Para desactivarlo:

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
    El razonamiento conservado debe activarse explícitamente porque Z.AI requiere que se reproduzca todo
    el `reasoning_content` histórico, lo que aumenta los tokens del prompt. Actívelo
    para cada modelo:

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

    Cuando está activado y el razonamiento está habilitado, OpenClaw envía
    `thinking: { type: "enabled", clear_thinking: false }` y reproduce el
    `reasoning_content` anterior para la misma transcripción compatible con OpenAI. La clave de
    parámetro en snake_case `preserve_thinking` funciona como alias.

    Los usuarios avanzados también pueden sobrescribir la carga útil exacta del proveedor mediante
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El Plugin de Z.AI registra la comprensión de imágenes.

    | Propiedad      | Valor       |
    | -------------- | ----------- |
    | Modelo         | `glm-4.6v`  |

    La comprensión de imágenes se resuelve automáticamente a partir de la autenticación configurada de Z.AI;
    no se necesita ninguna configuración adicional.

  </Accordion>

  <Accordion title="Detalles de autenticación">
    - Z.AI utiliza autenticación Bearer con su clave de API.
    - La opción de incorporación `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente probando los endpoints compatibles con su clave.
    - Utilice las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) cuando desee forzar una API específica.
    - La variable de entorno heredada `Z_AI_API_KEY` sigue siendo compatible; OpenClaw la copia a `ZAI_API_KEY` al iniciarse si `ZAI_API_KEY` no está definida.

  </Accordion>
</AccordionGroup>

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo de OpenClaw, incluidos los ajustes de proveedores y modelos.
  </Card>
</CardGroup>
