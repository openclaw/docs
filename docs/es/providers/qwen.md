---
read_when:
    - Quieres usar Qwen con OpenClaw
    - Tienes una suscripción al plan de tokens de Alibaba Cloud
    - Anteriormente usaste OAuth de Qwen
summary: Usa Qwen Cloud mediante su plugin de OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-11T23:28:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud es un plugin proveedor externo oficial de OpenClaw con el id canónico `qwen`. Está destinado a los endpoints Standard y Coding Plan de Qwen Cloud / Alibaba DashScope, expone Token Plan como `qwen-token-plan`, mantiene `modelstudio` como alias de compatibilidad, gestiona de forma independiente el id de proveedor personalizado documentado por Alibaba `bailian-token-plan` y expone el flujo de tokens de Qwen Portal como [`qwen-oauth`](/es/providers/qwen-oauth).

| Propiedad                    | Valor                                      |
| ---------------------------- | ------------------------------------------ |
| Proveedor                    | `qwen`                                     |
| Proveedor de Token Plan      | `qwen-token-plan`                          |
| Proveedor de Portal          | [`qwen-oauth`](/es/providers/qwen-oauth)      |
| Variable de entorno preferida | `QWEN_API_KEY`                            |
| Variable de entorno de Token Plan | `QWEN_TOKEN_PLAN_API_KEY`             |
| También aceptadas (compatibilidad) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Estilo de API                | Compatible con OpenAI                      |

<Tip>
`qwen3.7-plus` y `qwen3.6-plus` funcionan con los endpoints Coding Plan y Standard.
Para `qwen3.7-max` o `qwen3.6-flash`, usa un endpoint **Standard (pago por uso)**.
</Tip>

## Instalar el plugin

`qwen` se distribuye como plugin externo oficial y no viene incluido con el núcleo. Instálalo y reinicia el Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Primeros pasos

Elige el tipo de plan y sigue los pasos de configuración.

<Tabs>
  <Tab title="Coding Plan (suscripción)">
    **Recomendado para:** acceso mediante suscripción a través de Qwen Coding Plan.

    <Steps>
      <Step title="Obtener tu clave de API">
        Crea o copia una clave de API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Ejecutar la incorporación">
        Para el endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Para el endpoint de **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Comprobar que el modelo esté disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Los ids heredados de opción de autenticación `modelstudio-*` y las referencias de modelo `modelstudio/...` siguen
    funcionando como alias de compatibilidad, pero los nuevos flujos de configuración deben preferir los ids canónicos
    de opción de autenticación `qwen-*` y las referencias de modelo `qwen/...`. Si defines una entrada
    personalizada exacta `models.providers.modelstudio` con otro valor de `api`, ese
    proveedor personalizado gestiona las referencias `modelstudio/...` en lugar del alias de compatibilidad
    de Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pago por uso)">
    **Recomendado para:** acceso de pago por uso mediante el endpoint Standard de Model Studio, incluidos `qwen3.7-max` y `qwen3.6-flash`, que no están disponibles en Coding Plan.

    <Steps>
      <Step title="Obtener tu clave de API">
        Crea o copia una clave de API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Ejecutar la incorporación">
        Para el endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Para el endpoint de **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Comprobar que el modelo esté disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Los ids heredados de opción de autenticación `modelstudio-*` y las referencias de modelo `modelstudio/...` siguen
    funcionando como alias de compatibilidad, pero los nuevos flujos de configuración deben preferir los ids canónicos
    de opción de autenticación `qwen-*` y las referencias de modelo `qwen/...`. Si defines una entrada
    personalizada exacta `models.providers.modelstudio` con otro valor de `api`, ese
    proveedor personalizado gestiona las referencias `modelstudio/...` en lugar del alias de compatibilidad
    de Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (edición para equipos)">
    **Recomendado para:** acceso mediante suscripción de equipo basada en créditos a Qwen y a modelos de terceros compatibles a través de Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Obtener tu clave dedicada">
        Asigna una plaza de Token Plan y crea su clave dedicada `sk-sp-...`. Las claves de Token Plan, Coding Plan y pago por uso no son intercambiables. Consulta la [descripción general de Token Plan Global](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) o la [descripción general de Token Plan para China](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Ejecutar la incorporación">
        Para el endpoint **Global / Internacional** en Singapur:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Para el endpoint de **China** en Pekín:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Comprobar el proveedor">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    La guía de OpenClaw de Alibaba usa `bailian-token-plan` para un proveedor
    personalizado manual. El plugin registra ese id como propietario de compatibilidad, pero las nuevas
    configuraciones deben usar `qwen-token-plan`. Una entrada personalizada exacta
    `models.providers.bailian-token-plan` conserva la gestión de su transporte y
    catálogo configurados; nunca se combina con el catálogo canónico de OpenAI.
    </Note>

    <Warning>
    Usa Token Plan solo para sesiones interactivas de OpenClaw. No lo selecciones para
    tareas Cron, scripts desatendidos ni backends de aplicaciones. Alibaba indica que
    el uso no interactivo puede suspender la suscripción o revocar su clave de API.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Recomendado para:** un token de Qwen Portal para `https://portal.qwen.ai/v1`.

    Consulta [Qwen OAuth / Portal](/es/providers/qwen-oauth) para ver la página dedicada al proveedor
    y las notas de migración.

    <Steps>
      <Step title="Proporcionar tu token de Portal">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Comprobar que el modelo esté disponible">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` usa el mismo nombre de variable de entorno `QWEN_API_KEY` que el proveedor
    Qwen Cloud, pero almacena la autenticación bajo el id de proveedor `qwen-oauth` cuando se configura
    mediante la incorporación de OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Tipos de planes y endpoints

| Plan                       | Región | Opción de autenticación     | Endpoint                                                         |
| -------------------------- | ------ | --------------------------- | ---------------------------------------------------------------- |
| Coding Plan (suscripción)  | China  | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (suscripción)  | Global | `qwen-api-key`              | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                | Global | `qwen-oauth`                | `portal.qwen.ai/v1`                                              |
| Standard (pago por uso)    | China  | `qwen-standard-api-key-cn`  | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (pago por uso)    | Global | `qwen-standard-api-key`     | `dashscope-intl.dashscope.aliyuncs.com/compatible-mode/v1`       |
| Token Plan (edición para equipos) | China  | `qwen-token-plan-cn` | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (edición para equipos) | Global | `qwen-token-plan`    | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

El proveedor selecciona automáticamente el endpoint según tu opción de autenticación. Las opciones
canónicas usan la familia `qwen-*`; `modelstudio-*` se mantiene solo por compatibilidad.
Puedes reemplazarlo con un `baseUrl` personalizado en la configuración.

<Tip>
**Gestionar claves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentación:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

OpenClaw incluye este catálogo estático de Qwen. El catálogo tiene en cuenta el endpoint: las configuraciones de Coding
Plan omiten los modelos que solo funcionan en el endpoint Standard.

| Referencia del modelo       | Entrada        | Contexto  | Notas                        |
| --------------------------- | -------------- | --------- | ---------------------------- |
| `qwen/qwen3.5-plus`         | texto, imagen  | 1,000,000 | Modelo predeterminado        |
| `qwen/qwen3.6-flash`        | texto, imagen  | 1,000,000 | Solo endpoints Standard      |
| `qwen/qwen3.6-plus`         | texto, imagen  | 1,000,000 | Coding Plan + Standard       |
| `qwen/qwen3.7-max`          | texto          | 1,000,000 | Solo endpoints Standard      |
| `qwen/qwen3.7-plus`         | texto, imagen  | 1,000,000 | Coding Plan + Standard       |
| `qwen/qwen3-max-2026-01-23` | texto          | 262,144   | Línea Qwen Max               |
| `qwen/qwen3-coder-next`     | texto          | 262,144   | Programación                 |
| `qwen/qwen3-coder-plus`     | texto          | 1,000,000 | Programación                 |
| `qwen/MiniMax-M2.5`         | texto          | 1,000,000 | Razonamiento habilitado      |
| `qwen/glm-5`                | texto          | 202,752   | GLM                          |
| `qwen/glm-4.7`              | texto          | 202,752   | GLM                          |
| `qwen/kimi-k2.5`            | texto, imagen  | 262,144   | Moonshot AI mediante Alibaba |
| `qwen-oauth/qwen3.5-plus`   | texto, imagen  | 1,000,000 | Valor predeterminado de Qwen Portal |

<Note>
La disponibilidad puede variar según el endpoint y el plan de facturación, incluso cuando un modelo
aparece en el catálogo estático.
</Note>

### Catálogo de Token Plan

Token Plan usa una lista de permitidos independiente basada en coincidencias exactas de cadenas. Los modelos del plan
exclusivos para generación de imágenes no se incluyen aquí porque usan API diferentes.

| Referencia del modelo               | Entrada        | Contexto  |
| ----------------------------------- | -------------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | texto          | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | texto, imagen  | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | texto, imagen  | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | texto, imagen  | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | texto          | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | texto          | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | texto          | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | texto, imagen  | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | texto, imagen  | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | texto, imagen  | 262,144   |
| `qwen-token-plan/glm-5.2`           | texto          | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | texto          | 202,752   |
| `qwen-token-plan/glm-5`             | texto          | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | texto          | 196,608   |

## Controles de razonamiento

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` y `qwen3.6-plus` tienen
el razonamiento habilitado en el catálogo integrado. Para los modelos de razonamiento
de la familia `qwen`, el proveedor asigna los niveles de pensamiento de OpenClaw
al indicador de solicitud de nivel superior `enable_thinking` de DashScope: con el
pensamiento deshabilitado se envía `enable_thinking: false`, y con cualquier otro
nivel se envía `enable_thinking: true`. Los modelos personalizados pueden optar por
una carga útil de pensamiento alternativa para la plantilla de chat estableciendo
`compat.thinkingFormat: "qwen-chat-template"` en la entrada del modelo.

Los modelos de Token Plan también están marcados como compatibles con el razonamiento.
`kimi-k2.7-code` y `MiniMax-M2.5` solo funcionan con el pensamiento activado, por lo
que OpenClaw lo mantiene habilitado incluso cuando la sesión solicita `/think off`.
DeepSeek V4 asigna desde `minimal` hasta `high` al esfuerzo `high` del servicio y
asigna `xhigh` o `max` a `max`. GLM 5.2 acepta todo el intervalo desde `minimal`
hasta `max`; GLM 5.1 y GLM 5 aceptan hasta `xhigh`, y los tres usan `high` de forma
predeterminada. Los demás modelos híbridos siguen el estado de activación o
desactivación solicitado.

## Complementos multimodales

El Plugin `qwen` ofrece capacidades multimodales únicamente en los endpoints
**Estándar** de DashScope, no en los endpoints de Coding Plan:

- **Comprensión de imágenes y vídeos** mediante `qwen-vl-max-latest`
- **Generación de vídeo con Wan** mediante `wan2.6-t2v` (predeterminado), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

La comprensión de contenido multimedia se resuelve automáticamente a partir de la
autenticación de Qwen configurada; no se necesita ninguna configuración adicional.
Asegúrese de utilizar un endpoint Estándar (pago por uso) para que funcione la
comprensión de contenido multimedia.

Para establecer Qwen como proveedor de vídeo predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Límites de generación de vídeo: 1 vídeo de salida por solicitud, hasta 1 imagen de
entrada (imagen a vídeo), hasta 4 vídeos de entrada (vídeo a vídeo) y una duración
máxima de 10 segundos. Admite `size`, `aspectRatio`, `resolution`, `audio` y
`watermark`. Las entradas de imagen o vídeo de referencia requieren URL http(s)
remotas; las rutas de archivos locales se rechazan de antemano porque el endpoint
de vídeo de DashScope no acepta búferes locales cargados para esas referencias.

<Note>
Consulte [Generación de vídeo](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Disponibilidad de Qwen 3.6 y 3.7">
    `qwen3.7-plus` y `qwen3.6-plus` están disponibles en los endpoints de Coding Plan y Estándar. `qwen3.7-max` y `qwen3.6-flash` solo están disponibles en Estándar. Los endpoints Estándar (pago por uso) son:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw omite `qwen3.7-max` y `qwen3.6-flash` de los catálogos de Coding Plan.
    Si un endpoint de Coding Plan devuelve un error de «modelo no compatible» para cualquiera de ellos,
    cambie al endpoint Estándar y a la clave correspondientes.

  </Accordion>

  <Accordion title="Enrutamiento regional de la generación de vídeo">
    OpenClaw asigna la región de Qwen configurada al host AIGC de DashScope
    correspondiente antes de enviar un trabajo de vídeo:

    - Global/Internacional: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Un valor normal de `models.providers.qwen.baseUrl` que apunte a los hosts de
    Coding Plan o Estándar de Qwen sigue enrutando la generación de vídeo al endpoint
    regional de vídeo de DashScope correspondiente.

  </Accordion>

  <Accordion title="Compatibilidad del uso en streaming">
    Los endpoints nativos de Qwen anuncian compatibilidad con el uso en streaming en el
    transporte compartido `openai-completions`, por lo que los identificadores de proveedores
    personalizados compatibles con DashScope que apunten a los mismos hosts nativos heredan
    el mismo comportamiento sin requerir específicamente el identificador del proveedor
    integrado `qwen`. Esto se aplica a los endpoints de Coding Plan, Estándar y Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Plan de capacidades">
    El Plugin `qwen` se está posicionando como el punto de referencia del proveedor para
    toda la oferta de Qwen Cloud, no solo para los modelos de programación y texto.

    - **Modelos de texto/chat:** disponibles mediante el Plugin
    - **Llamadas a herramientas, salida estructurada y pensamiento:** heredados del transporte compatible con OpenAI
    - **Generación de imágenes:** planificada en la capa del Plugin del proveedor
    - **Comprensión de imágenes y vídeos:** disponible mediante el Plugin en el endpoint Estándar
    - **Voz/audio:** planificados en la capa del Plugin del proveedor
    - **Embeddings/reordenación de memoria:** planificados mediante la interfaz del adaptador de embeddings
    - **Generación de vídeo:** disponible mediante el Plugin a través de la capacidad compartida de generación de vídeo

  </Accordion>

  <Accordion title="Configuración del entorno y del demonio">
    Si el Gateway se ejecuta como demonio (launchd/systemd), asegúrese de que
    `QWEN_API_KEY` o `QWEN_TOKEN_PLAN_API_KEY` estén disponibles para ese proceso
    (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedores.
  </Card>
  <Card title="Alibaba Model Studio" href="/es/providers/alibaba" icon="cloud">
    Proveedor integrado de generación de vídeo Wan en la misma plataforma DashScope.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución de problemas generales y preguntas frecuentes.
  </Card>
</CardGroup>
