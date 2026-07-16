---
read_when:
    - Quiere usar modelos Z.AI / GLM en OpenClaw
    - Necesita una configuración sencilla de ZAI_API_KEY
summary: Usa Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T11:55:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
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
referencias como `zai/glm-5.2`: proveedor `zai`, id. de modelo `glm-5.2`.

## Primeros pasos

Instale primero el plugin del proveedor:

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
      <Step title="Verificar que el modelo aparece en la lista">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Recomendado para:** usuarios que desean forzar una superficie específica de Coding Plan o de la API general.

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

| Opción de incorporación   | URL base                                      | Modelo predeterminado |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` detecta automáticamente uno de estos cuatro probando su clave con la API
de finalizaciones de chat de cada endpoint, comprobando los endpoints generales (`zai-global`,
y después `zai-cn`) antes que los endpoints de Coding Plan (`zai-coding-global`, y después
`zai-coding-cn`), y deteniéndose en el primer endpoint que acepte una solicitud.
Utilice una opción `--auth-choice` explícita para forzar un endpoint de Coding Plan si su clave
funciona con ambos.

## Límites de frecuencia y sobrecargas

Z.AI documenta Coding Plan y las herramientas de agentes de uso general como servicios
con capacidad administrada. Según la propia documentación de Z.AI:

- [Las herramientas de agentes de uso general](https://docs.z.ai/devpack/tool/others),
  incluido OpenClaw, se ofrecen según la capacidad disponible. Durante períodos de alta carga
  de inferencia, normalmente entre las 2 y las 6 p. m., hora de Singapur, algunas solicitudes pueden sufrir
  límites de frecuencia temporales.
- [Los límites de frecuencia y concurrencia de Coding Plan](https://docs.z.ai/devpack/usage-policy)
  están vinculados al nivel del plan y pueden ajustarse dinámicamente según la disponibilidad
  de recursos. Las horas de menor actividad pueden permitir una mayor concurrencia.
- [El código de error de la API `1302`](https://docs.z.ai/api-reference/api-code) significa «Se ha
  alcanzado el límite de frecuencia de las solicitudes». El código de error de la API `1305` significa «El servicio puede estar
  temporalmente sobrecargado; inténtelo de nuevo más tarde».

Si aparece una respuesta temporal `429` o `1305` durante un período de alta actividad, espere y
vuelva a intentar la solicitud. Si los errores se repiten fuera de los períodos de máxima actividad o solo
se producen con un endpoint, modelo o formato de solicitud, compruebe primero el endpoint
y el modelo configurados:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Las claves de Coding Plan deben utilizar un endpoint de Coding Plan como
`https://api.z.ai/api/coding/paas/v4`; las claves de la API general deben utilizar un endpoint de la API general
como `https://api.z.ai/api/paas/v4`. Los errores persistentes con la
misma clave y el mismo endpoint pueden indicar un rechazo del proveedor o una limitación del plan,
no una limitación de frecuencia habitual por carga máxima.

## Ejemplo de configuración

<Tip>
`zai-api-key` permite que OpenClaw detecte el endpoint de Z.AI correspondiente a partir de la clave y
aplique automáticamente la URL base correcta. Utilice las opciones regionales explícitas cuando
desee forzar una superficie específica de Coding Plan o de la API general.
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

El plugin del proveedor `zai` incluye su catálogo en el manifiesto del plugin, por lo que el listado
de solo lectura puede mostrar las filas GLM conocidas sin cargar el entorno de ejecución del proveedor:

```bash
openclaw models list --all --provider zai
```

El catálogo respaldado por el manifiesto incluye actualmente:

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

<Tip>
Los modelos GLM están disponibles como `zai/<model>` (ejemplo: `zai/glm-5`).
</Tip>

<Note>
La configuración de Coding Plan utiliza de forma predeterminada `zai/glm-5.2`; la configuración de la API general conserva
`zai/glm-5.1`. En los endpoints de Coding Plan, la detección automática recurre a
`glm-5.1` y después a `glm-4.7` cuando la clave o el plan no ofrece GLM-5.2. Las versiones
y la disponibilidad de GLM pueden cambiar; ejecute `openclaw models list --all --provider zai`
para consultar el catálogo conocido por la versión instalada.
</Note>

## Niveles de razonamiento

<Tabs>
  <Tab title="GLM-5.2">
    Intervalo completo: `off`, `low`, `high`, `max` (valor predeterminado: `off`). OpenClaw asigna
    `low` y `high` al esfuerzo de razonamiento `high` de Z.AI, y `max` al
    esfuerzo `max` de Z.AI, mediante `reasoning_effort` en la carga útil de la solicitud.
  </Tab>
  <Tab title="Otros modelos GLM">
    Solo conmutación binaria: `off` y `low` (se muestra como `on` en los selectores), con
    `off` como valor predeterminado. Establecer el razonamiento en `off` envía `thinking: { type: "disabled" }`;
    cualquier otro nivel deja intacta la carga útil de la solicitud (se aplica el comportamiento
    de razonamiento predeterminado de Z.AI).
  </Tab>
</Tabs>

Establecer el razonamiento en `off` evita respuestas que consumen el presupuesto de salida en
`reasoning_content` antes de mostrar texto visible.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Resolución anticipada de modelos GLM-5 desconocidos">
    Los identificadores `glm-5*` desconocidos siguen resolviéndose anticipadamente en la ruta del proveedor mediante
    la síntesis de metadatos propiedad del proveedor a partir de la plantilla `glm-4.7` cuando el identificador
    coincide con la forma actual de la familia GLM-5.
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
    La conservación del razonamiento es opcional porque Z.AI exige volver a reproducir todo el
    `reasoning_content` histórico, lo que aumenta los tokens del prompt. Actívela
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

    Cuando está activada y el razonamiento está habilitado, OpenClaw envía
    `thinking: { type: "enabled", clear_thinking: false }` y vuelve a reproducir los
    `reasoning_content` anteriores para la misma transcripción compatible con OpenAI. La clave de parámetro en snake_case
    `preserve_thinking` funciona como alias.

    Los usuarios avanzados pueden seguir anulando la carga útil exacta del proveedor con
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El plugin de Z.AI registra la comprensión de imágenes.

    | Propiedad      | Valor       |
    | ------------- | ----------- |
    | Modelo         | `glm-4.6v`  |

    La comprensión de imágenes se resuelve automáticamente a partir de la autenticación de Z.AI configurada; no
    se necesita configuración adicional.

  </Accordion>

  <Accordion title="Detalles de autenticación">
    - Z.AI utiliza autenticación Bearer con su clave de API.
    - La opción de incorporación `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente probando los endpoints compatibles con su clave.
    - Utilice las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) cuando desee forzar una superficie de API específica.
    - La variable de entorno heredada `Z_AI_API_KEY` aún se admite; OpenClaw la copia en `ZAI_API_KEY` durante el inicio si `ZAI_API_KEY` no está definida.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración de OpenClaw, incluidos los ajustes del proveedor y del modelo.
  </Card>
</CardGroup>
