---
read_when:
    - Quieres usar Qwen con OpenClaw
    - Tiene una suscripción al plan de tokens de Alibaba Cloud
summary: Usa Qwen Cloud mediante su plugin de OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-19T02:24:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74f94a35631dcdf8c9afc12e86d7a9d6b51a359411ba36f8820f8b1e7c03a27a
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud es un Plugin de proveedor externo oficial de OpenClaw con el id canónico `qwen`. Está dirigido a los endpoints Standard y Coding Plan de Qwen Cloud / Alibaba DashScope, expone Token Plan como `qwen-token-plan`, mantiene `modelstudio` como alias de compatibilidad y gestiona de forma independiente el id de proveedor personalizado `bailian-token-plan` documentado por Alibaba.

| Propiedad                    | Valor                                      |
| ---------------------------- | ------------------------------------------ |
| Proveedor                    | `qwen`                                     |
| Proveedor de Token Plan      | `qwen-token-plan`                          |
| Variable de entorno preferida | `QWEN_API_KEY`                             |
| Variable de entorno de Token Plan | `QWEN_TOKEN_PLAN_API_KEY`                  |
| También se acepta (compatibilidad) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Estilo de API                | Compatible con OpenAI                      |

<Tip>
`qwen3.7-plus` y `qwen3.6-plus` funcionan con los endpoints Coding Plan y Standard.
Para `qwen3.7-max` o `qwen3.6-flash`, use un endpoint **Standard (pago por uso)**.
</Tip>

## Instalar el Plugin

`qwen` se distribuye como Plugin externo oficial y no se incluye con el núcleo. Instálelo y reinicie el Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Primeros pasos

Elija el tipo de plan y siga los pasos de configuración.

<Tabs>
  <Tab title="Coding Plan (suscripción)">
    **Ideal para:** acceso por suscripción mediante Qwen Coding Plan.

    <Steps>
      <Step title="Obtener la clave de API">
        Cree o copie una clave de API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Ejecutar la incorporación">
        Para el endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Para el endpoint **China**:

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
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Los ids de opción de autenticación `modelstudio-*` y las referencias de modelo `modelstudio/...` heredados siguen
    funcionando como alias de compatibilidad, pero los nuevos flujos de configuración deben preferir los ids de opción
    de autenticación canónicos `qwen-*` y las referencias de modelo `qwen/...`. Si define una entrada
    personalizada `models.providers.modelstudio` exacta con otro valor de `api`, ese
    proveedor personalizado gestiona las referencias `modelstudio/...` en lugar del alias de compatibilidad
    de Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pago por uso)">
    **Ideal para:** acceso de pago por uso mediante el endpoint Standard de Model Studio, incluidos `qwen3.7-max` y `qwen3.6-flash`, que no están disponibles en Coding Plan.

    <Steps>
      <Step title="Obtener la clave de API">
        Cree o copie una clave de API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Ejecutar la incorporación">
        Para el endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Para el endpoint **China**:

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
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Los ids de opción de autenticación `modelstudio-*` y las referencias de modelo `modelstudio/...` heredados siguen
    funcionando como alias de compatibilidad, pero los nuevos flujos de configuración deben preferir los ids de opción
    de autenticación canónicos `qwen-*` y las referencias de modelo `qwen/...`. Si define una entrada
    personalizada `models.providers.modelstudio` exacta con otro valor de `api`, ese
    proveedor personalizado gestiona las referencias `modelstudio/...` en lugar del alias de compatibilidad
    de Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (edición para equipos)">
    **Ideal para:** acceso por suscripción de equipo basado en créditos a Qwen y a modelos de terceros compatibles mediante Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Obtener la clave dedicada">
        Asigne una plaza de Token Plan y cree su clave `sk-sp-...` dedicada. Las claves de Token Plan, Coding Plan y pago por uso no son intercambiables. Consulte la [descripción general de Token Plan Global](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) o la [descripción general de Token Plan China](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Ejecutar la incorporación">
        Para el endpoint **Global / Internacional** en Singapur:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Para el endpoint **China** en Pekín:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Verificar el proveedor">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Responde con: token plan listo"
        ```
      </Step>
    </Steps>

    <Note>
    La guía de OpenClaw de Alibaba usa `bailian-token-plan` para un proveedor
    personalizado manual. El Plugin registra ese id como propietario de compatibilidad, pero las nuevas
    configuraciones deben usar `qwen-token-plan`. Una entrada personalizada
    `models.providers.bailian-token-plan` exacta conserva la propiedad del transporte y el catálogo
    configurados; nunca se combina con el catálogo canónico de OpenAI.
    </Note>

    <Warning>
    Use Token Plan únicamente para sesiones interactivas de OpenClaw. No lo seleccione para
    trabajos de cron, scripts desatendidos ni backends de aplicaciones. Alibaba indica que
    el uso no interactivo puede suspender la suscripción o revocar su clave de API.
    </Warning>

  </Tab>

</Tabs>

## Tipos de planes y endpoints

| Plan                       | Región | Opción de autenticación    | Endpoint                                                         |
| -------------------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (suscripción)  | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (suscripción)  | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Standard (pago por uso)    | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (pago por uso)    | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (edición para equipos) | China  | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (edición para equipos) | Global | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

El proveedor selecciona automáticamente el endpoint según la opción de autenticación. Las opciones
canónicas usan la familia `qwen-*`; `modelstudio-*` se mantiene solo por compatibilidad.
Puede sustituirlo por un `baseUrl` personalizado en la configuración.

<Tip>
**Administrar claves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentación:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

OpenClaw incluye este catálogo estático de Qwen. El catálogo tiene en cuenta el endpoint: las
configuraciones de Coding Plan omiten los modelos que solo funcionan en el endpoint Standard.

| Referencia de modelo        | Entrada     | Contexto  | Notas                   |
| --------------------------- | ----------- | --------- | ----------------------- |
| `qwen/qwen3.5-plus`         | texto, imagen | 1,000,000 | Modelo predeterminado   |
| `qwen/qwen3.6-flash`        | texto, imagen | 1,000,000 | Solo endpoints Standard |
| `qwen/qwen3.6-plus`         | texto, imagen | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3.7-max`          | texto        | 1,000,000 | Solo endpoints Standard |
| `qwen/qwen3.7-plus`         | texto, imagen | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3-max-2026-01-23` | texto        | 262,144   | Línea Qwen Max          |
| `qwen/qwen3-coder-next`     | texto        | 262,144   | Programación            |
| `qwen/qwen3-coder-plus`     | texto        | 1,000,000 | Programación            |
| `qwen/MiniMax-M2.5`         | texto        | 1,000,000 | Razonamiento habilitado |
| `qwen/glm-5`                | texto        | 202,752   | GLM                     |
| `qwen/glm-4.7`              | texto        | 202,752   | GLM                     |
| `qwen/kimi-k2.5`            | texto, imagen | 262,144   | Moonshot AI mediante Alibaba |

<Note>
La disponibilidad puede variar según el endpoint y el plan de facturación, incluso si un modelo
está presente en el catálogo estático.
</Note>

### Catálogo de Token Plan

Token Plan usa una lista de permitidos independiente basada en coincidencias exactas de cadenas. Los modelos
del plan exclusivos para generación de imágenes no se incluyen aquí porque usan API diferentes.

| Referencia de modelo                | Entrada     | Contexto  |
| ----------------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | texto        | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | texto, imagen | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | texto, imagen | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | texto, imagen | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | texto        | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | texto        | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | texto        | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | texto, imagen | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | texto, imagen | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | texto, imagen | 262,144   |
| `qwen-token-plan/glm-5.2`           | texto        | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | texto        | 202,752   |
| `qwen-token-plan/glm-5`             | texto        | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | texto        | 196,608   |

## Controles de razonamiento

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` y `qwen3.6-plus` tienen el
razonamiento habilitado en el catálogo integrado. Para los modelos de razonamiento de la familia `qwen`,
el proveedor asigna los niveles de razonamiento de OpenClaw al indicador de solicitud
de nivel superior `enable_thinking` de DashScope: con el razonamiento deshabilitado, envía `enable_thinking: false`;
con cualquier otro nivel, envía `enable_thinking: true`. Los modelos personalizados pueden habilitar una
carga útil de razonamiento alternativa para la plantilla de chat estableciendo
`compat.thinkingFormat: "qwen-chat-template"` en la entrada del modelo.

Los modelos de Token Plan también están marcados como capaces de razonar. `kimi-k2.7-code` y
`MiniMax-M2.5` solo funcionan con razonamiento, por lo que OpenClaw lo mantiene habilitado incluso cuando
la sesión solicita `/think off`. DeepSeek V4 asigna desde `minimal` hasta `high`
al esfuerzo `high` del servicio y asigna `xhigh` o `max` a `max`. GLM 5.2 admite
todo el intervalo desde `minimal` hasta `max`; GLM 5.1 y GLM 5 admiten hasta
`xhigh`, y los tres usan `high` de forma predeterminada. Los demás modelos híbridos respetan el
estado de activación o desactivación solicitado.

## Complementos multimodales

El Plugin `qwen` ofrece capacidades multimodales únicamente en los endpoints
**Standard** de DashScope, no en los endpoints Coding Plan:

- **Comprensión de imágenes y vídeos** mediante `qwen3.6-plus`
- **Generación de vídeos Wan** mediante `wan2.6-t2v` (predeterminado), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

La comprensión de contenido multimedia se resuelve automáticamente a partir de la autenticación de Qwen configurada; no se
necesita ninguna configuración adicional. Asegúrese de utilizar un endpoint Standard (pago por uso) para
que funcione la comprensión de contenido multimedia.

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

Límites de generación de vídeo: 1 vídeo de salida por solicitud, hasta 1 imagen de entrada
(de imagen a vídeo), hasta 4 vídeos de entrada (de vídeo a vídeo), con una duración máxima de 10 segundos.
Admite `size`, `aspectRatio`, `resolution`, `audio` y
`watermark`. Las entradas de imágenes o vídeos de referencia requieren URL http(s) remotas; las rutas
de archivos locales se rechazan de antemano porque el endpoint de vídeo de DashScope no
acepta búferes locales cargados para esas referencias.

<Note>
Consulte [Generación de vídeo](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Disponibilidad de Qwen 3.6 y 3.7">
    `qwen3.7-plus` y `qwen3.6-plus` están disponibles en los endpoints de Coding Plan y Standard. `qwen3.7-max` y `qwen3.6-flash` solo están disponibles en Standard. Los endpoints Standard (pago por uso) son:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw omite `qwen3.7-max` y `qwen3.6-flash` de los catálogos de Coding Plan.
    Si un endpoint de Coding Plan devuelve un error de "modelo no compatible" para cualquiera de ellos,
    cambie al endpoint Standard correspondiente y a su clave.

  </Accordion>

  <Accordion title="Enrutamiento regional de la generación de vídeo">
    OpenClaw asigna la región de Qwen configurada al host AIGC de DashScope correspondiente
    antes de enviar un trabajo de vídeo:

    - Global/Internacional: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Un `models.providers.qwen.baseUrl` normal que apunte a los hosts de Qwen de Coding Plan
    o Standard sigue enrutando la generación de vídeo al endpoint de vídeo regional
    de DashScope correspondiente.

  </Accordion>

  <Accordion title="Compatibilidad del uso en streaming">
    Los endpoints nativos de Qwen anuncian compatibilidad del uso en streaming en el transporte
    compartido `openai-completions`, por lo que los identificadores de proveedores personalizados compatibles con DashScope
    que apuntan a los mismos hosts nativos heredan el mismo comportamiento sin requerir
    específicamente el identificador de proveedor integrado `qwen`. Esto se aplica a los endpoints de Coding Plan,
    Standard y Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Plan de capacidades">
    El plugin `qwen` se está posicionando como el espacio del proveedor para toda la superficie de Qwen
    Cloud, no solo para los modelos de programación y texto.

    - **Modelos de texto/chat:** disponibles mediante el plugin
    - **Llamadas a herramientas, salida estructurada y razonamiento:** heredados del transporte compatible con OpenAI
    - **Generación de imágenes:** prevista en la capa del plugin del proveedor
    - **Comprensión de imágenes/vídeos:** disponible mediante el plugin en el endpoint Standard
    - **Voz/audio:** previsto en la capa del plugin del proveedor
    - **Embeddings/reordenación de memoria:** previstos mediante la superficie del adaptador de embeddings
    - **Generación de vídeo:** disponible mediante el plugin a través de la capacidad compartida de generación de vídeo

  </Accordion>

  <Accordion title="Configuración del entorno y del daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrese de que `QWEN_API_KEY`
    o `QWEN_TOKEN_PLAN_API_KEY` esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

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
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
