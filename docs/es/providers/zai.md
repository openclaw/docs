---
read_when:
    - Quieres usar modelos Z.AI / GLM en OpenClaw
    - Necesita una configuración sencilla de ZAI_API_KEY
summary: Usar Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-19T02:09:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ca3e7ef743e908550f4d96ba6f78167e38cabd15b14044683b02493ebbf3025
    source_path: providers/zai.md
    workflow: 16
---

Z.AI es la plataforma de API para los modelos **GLM**. Proporciona API REST para GLM y
utiliza claves de API para la autenticación. Cree su clave de API en la consola de Z.AI.
OpenClaw utiliza el proveedor `zai` con una clave de API de Z.AI.

| Propiedad | Valor                                        |
| -------- | -------------------------------------------- |
| Proveedor | `zai`                                        |
| Paquete  | `@openclaw/zai-provider`                     |
| Autenticación     | `ZAI_API_KEY` (alias heredado: `Z_AI_API_KEY`) |
| API      | Finalizaciones de chat de Z.AI (autenticación Bearer)          |

## Modelos GLM

GLM es una familia de modelos, no un proveedor independiente. En OpenClaw, los modelos GLM utilizan
referencias como `zai/glm-5.2`: proveedor `zai`, id de modelo `glm-5.2`.

## Primeros pasos

Instale primero el Plugin del proveedor:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Detectar automáticamente el endpoint">
    **Recomendado para:** la mayoría de los usuarios. OpenClaw prueba los endpoints compatibles de Z.AI con su clave de API y aplica automáticamente la URL base correcta.

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verificar que el modelo aparezca">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Recomendado para:** usuarios que quieran forzar un Coding Plan específico o una superficie de API general.

    <Steps>
      <Step title="Elegir la opción de incorporación adecuada">
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
      <Step title="Verificar que el modelo aparezca">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Endpoints

| Opción de incorporación   | URL base                                      | Modelo predeterminado |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

Z.AI también publica la URL base de Coding Plan compatible con Anthropic
`https://api.z.ai/api/anthropic`. Las opciones de Z.AI de OpenClaw utilizan los endpoints documentados
de finalizaciones de chat de OpenAI indicados anteriormente; la URL de Anthropic es para clientes que
se comunican directamente mediante Anthropic Messages.

`zai-api-key` detecta automáticamente uno de estos cuatro endpoints probando su clave con la
API de finalizaciones de chat de cada endpoint; comprueba los endpoints generales (`zai-global`,
y después `zai-cn`) antes que los endpoints de Coding Plan (`zai-coding-global`, y después
`zai-coding-cn`) y se detiene en el primer endpoint que acepta una solicitud.
Utilice un `--auth-choice` explícito para forzar un endpoint de Coding Plan si su clave
funciona en ambos.

## Límites de velocidad y sobrecargas

Z.AI documenta Coding Plan y las herramientas de agente de uso general como servicios
con capacidad administrada. Según la documentación de Z.AI:

- [Las herramientas de agente de uso general](https://docs.z.ai/devpack/tool/others),
  incluido OpenClaw, se proporcionan según la capacidad disponible. Durante periodos de alta carga de
  inferencia, normalmente entre las 2 y las 6 p. m., hora de Singapur, algunas solicitudes pueden encontrar
  límites de velocidad temporales.
- [Los límites de velocidad y concurrencia de Coding Plan](https://docs.z.ai/devpack/usage-policy)
  están vinculados al nivel del plan y pueden ajustarse dinámicamente en función de la disponibilidad
  de recursos. Las horas de menor actividad pueden ofrecer una mayor concurrencia.
- [El código de error de API `1302`](https://docs.z.ai/api-reference/api-code) significa «Se
  alcanzó el límite de velocidad de las solicitudes». El código de error de API `1305` significa «El servicio puede estar
  temporalmente sobrecargado; vuelva a intentarlo más tarde».

Si recibe una respuesta temporal `429` o `1305` durante un periodo de alta actividad, espere y
vuelva a intentar la solicitud. Si los fallos se repiten fuera de los periodos de máxima actividad o solo
se producen con un endpoint, modelo o formato de solicitud, compruebe primero el endpoint
y el modelo configurados:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Las claves de Coding Plan deben utilizar un endpoint de Coding Plan, como
`https://api.z.ai/api/coding/paas/v4`; las claves de la API general deben utilizar un endpoint de la API general,
como `https://api.z.ai/api/paas/v4`. Los fallos persistentes con la
misma clave y el mismo endpoint pueden indicar un rechazo del proveedor o una limitación del plan,
no una limitación habitual debida a cargas máximas.

## Ejemplo de configuración

<Tip>
`zai-api-key` permite que OpenClaw detecte el endpoint de Z.AI correspondiente a partir de la clave y
aplique automáticamente la URL base correcta. Utilice las opciones regionales explícitas cuando
quiera forzar un Coding Plan específico o una superficie de API general.
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
de solo lectura puede mostrar filas conocidas de GLM sin cargar el entorno de ejecución del proveedor:

```bash
openclaw models list --all --provider zai
```

Actualmente, el catálogo respaldado por el manifiesto incluye:

| Referencia del modelo            | Notas                           |
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

Los metadatos del coste de tokens del catálogo siguen los
[precios actuales de pago por uso](https://docs.z.ai/guides/overview/pricing) de Z.AI. Las suscripciones a Coding Plan
utilizan la cuota del plan en lugar de la facturación por token; consulte la
[página de suscripción](https://z.ai/subscribe) actual para conocer los precios y la disponibilidad de los planes.

<Tip>
Los modelos GLM están disponibles como `zai/<model>` (ejemplo: `zai/glm-5`).
</Tip>

<Note>
La configuración de Coding Plan utiliza de forma predeterminada `zai/glm-5.2`; la configuración de la API general mantiene
`zai/glm-5.1`. En los endpoints de Coding Plan, la detección automática recurre a
`glm-5.1` y después a `glm-4.7` cuando la clave o el plan no permite acceder a GLM-5.2. Las versiones
y la disponibilidad de GLM pueden cambiar; ejecute `openclaw models list --all --provider zai`
para ver el catálogo conocido por la versión instalada.
</Note>

## Niveles de razonamiento

<Tabs>
  <Tab title="GLM-5.2">
    Intervalo completo: `off`, `low`, `high`, `max` (valor predeterminado: `off`). OpenClaw asigna
    `low` y `high` al esfuerzo de razonamiento `high` de Z.AI, y `max` al
    esfuerzo `max` de Z.AI, mediante `reasoning_effort` en la carga útil de la solicitud.
  </Tab>
  <Tab title="Otros modelos GLM">
    Solo alternancia binaria: `off` y `low` (se muestra como `on` en los selectores), con
    `off` como valor predeterminado. Configurar el razonamiento en `off` envía `thinking: { type: "disabled" }`;
    cualquier otro nivel deja intacta la carga útil de la solicitud (se aplica el comportamiento
    de razonamiento predeterminado de Z.AI).
  </Tab>
</Tabs>

Configurar el razonamiento en `off` evita respuestas que consumen el presupuesto de salida en
`reasoning_content` antes del texto visible.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Resolución futura de modelos GLM-5 desconocidos">
    Los identificadores `glm-5*` desconocidos siguen resolviéndose de forma anticipada en la ruta del proveedor
    mediante la síntesis de metadatos propiedad del proveedor a partir de la plantilla `glm-4.7` cuando el identificador
    coincide con el formato actual de la familia GLM-5.
  </Accordion>

  <Accordion title="Transmisión de llamadas a herramientas">
    `tool_stream` está habilitado de forma predeterminada para la transmisión de llamadas a herramientas de Z.AI. Para deshabilitarlo:

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
    `reasoning_content` histórico completo, lo que aumenta los tokens del prompt. Habilítelo
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
    `thinking: { type: "enabled", clear_thinking: false }` y reproduce el contenido anterior de
    `reasoning_content` para la misma transcripción compatible con OpenAI. La clave de parámetro en snake_case
    `preserve_thinking` funciona como alias.

    Los usuarios avanzados aún pueden sustituir la carga útil exacta del proveedor mediante
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El Plugin de Z.AI registra la comprensión de imágenes.

    | Propiedad      | Valor       |
    | ------------- | ----------- |
    | Modelo         | `glm-4.6v`  |

    La comprensión de imágenes se resuelve automáticamente a partir de la autenticación de Z.AI configurada; no
    se necesita ninguna configuración adicional.

  </Accordion>

  <Accordion title="Detalles de autenticación">
    - Z.AI utiliza autenticación Bearer con su clave de API.
    - La opción de incorporación `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente probando los endpoints compatibles con su clave.
    - Utilice las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) cuando quiera forzar una superficie de API específica.
    - La variable de entorno heredada `Z_AI_API_KEY` todavía se acepta; OpenClaw la copia a `ZAI_API_KEY` durante el inicio si `ZAI_API_KEY` no está definida.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo de OpenClaw, incluidos los ajustes del proveedor y del modelo.
  </Card>
</CardGroup>
