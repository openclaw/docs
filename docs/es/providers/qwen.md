---
read_when:
    - Quieres usar Qwen con OpenClaw
    - Usaste Qwen OAuth anteriormente
summary: Usa Qwen Cloud a través de su Plugin de OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-05T11:38:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3678ac0e56ee7cae00cb4a7e17a051734b288ebb4dfab47cb99e5b7ab745c3ce
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud es un Plugin proveedor externo oficial de OpenClaw con id canónico `qwen`. Está orientado a los puntos de conexión Standard y Coding Plan de Qwen Cloud / Alibaba DashScope, mantiene los ids heredados `modelstudio` funcionando como alias de compatibilidad y expone el flujo de token de Qwen Portal como un proveedor separado, [`qwen-oauth`](/es/providers/qwen-oauth).

| Propiedad              | Valor                                      |
| ---------------------- | ------------------------------------------ |
| Proveedor              | `qwen`                                     |
| Proveedor del Portal   | [`qwen-oauth`](/es/providers/qwen-oauth)      |
| Variable de entorno preferida | `QWEN_API_KEY`                     |
| También aceptadas (compatibilidad) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Estilo de API          | Compatible con OpenAI                      |

<Tip>
Para `qwen3.6-plus`, usa un punto de conexión **Standard (pago por uso)**. No está disponible en los puntos de conexión de Coding Plan.
</Tip>

## Instalar Plugin

`qwen` se distribuye como un Plugin externo oficial, no incluido con el núcleo. Instálalo y reinicia Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Primeros pasos

Elige tu tipo de plan y sigue los pasos de configuración.

<Tabs>
  <Tab title="Coding Plan (suscripción)">
    **Ideal para:** acceso basado en suscripción mediante Qwen Coding Plan.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea o copia una clave de API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Ejecuta la incorporación">
        Para el punto de conexión **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Para el punto de conexión de **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Configura un modelo predeterminado">
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
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Los ids heredados de auth-choice `modelstudio-*` y las referencias de modelo `modelstudio/...` aún
    funcionan como alias de compatibilidad, pero los nuevos flujos de configuración deben preferir los ids
    canónicos de auth-choice `qwen-*` y las referencias de modelo `qwen/...`. Si defines una entrada
    personalizada exacta `models.providers.modelstudio` con otro valor de `api`, ese
    proveedor personalizado es propietario de las referencias `modelstudio/...` en lugar del alias de
    compatibilidad de Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pago por uso)">
    **Ideal para:** acceso de pago por uso mediante el punto de conexión Standard Model Studio, incluidos modelos como `qwen3.6-plus` que no están disponibles en Coding Plan.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea o copia una clave de API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Ejecuta la incorporación">
        Para el punto de conexión **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Para el punto de conexión de **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Configura un modelo predeterminado">
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
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Los ids heredados de auth-choice `modelstudio-*` y las referencias de modelo `modelstudio/...` aún
    funcionan como alias de compatibilidad, pero los nuevos flujos de configuración deben preferir los ids
    canónicos de auth-choice `qwen-*` y las referencias de modelo `qwen/...`. Si defines una entrada
    personalizada exacta `models.providers.modelstudio` con otro valor de `api`, ese
    proveedor personalizado es propietario de las referencias `modelstudio/...` en lugar del alias de
    compatibilidad de Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Ideal para:** un token de Qwen Portal contra `https://portal.qwen.ai/v1`.

    Consulta [Qwen OAuth / Portal](/es/providers/qwen-oauth) para ver la página
    dedicada del proveedor y las notas de migración.

    <Steps>
      <Step title="Proporciona tu token del portal">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Configura un modelo predeterminado">
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
      <Step title="Verifica que el modelo esté disponible">
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

## Tipos de plan y puntos de conexión

| Plan                       | Región | Opción de autenticación    | Punto de conexión                                |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Coding Plan (suscripción)  | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (suscripción)  | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |
| Standard (pago por uso)    | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pago por uso)    | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |

El proveedor selecciona automáticamente el punto de conexión según tu opción de autenticación. Las
opciones canónicas usan la familia `qwen-*`; `modelstudio-*` se mantiene solo por compatibilidad.
Sobrescríbelo con un `baseUrl` personalizado en la configuración.

<Tip>
**Administrar claves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentación:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

OpenClaw distribuye este catálogo estático de Qwen. El catálogo tiene en cuenta el punto de conexión: las configuraciones de Coding
Plan omiten modelos que solo funcionan en el punto de conexión Standard.

| Referencia de modelo        | Entrada     | Contexto  | Notas                   |
| --------------------------- | ----------- | --------- | ----------------------- |
| `qwen/qwen3.5-plus`         | texto, imagen | 1,000,000 | Modelo predeterminado   |
| `qwen/qwen3.6-plus`         | texto, imagen | 1,000,000 | Solo puntos de conexión Standard |
| `qwen/qwen3-max-2026-01-23` | texto       | 262,144   | Línea Qwen Max          |
| `qwen/qwen3-coder-next`     | texto       | 262,144   | Programación            |
| `qwen/qwen3-coder-plus`     | texto       | 1,000,000 | Programación            |
| `qwen/MiniMax-M2.5`         | texto       | 1,000,000 | Razonamiento habilitado |
| `qwen/glm-5`                | texto       | 202,752   | GLM                     |
| `qwen/glm-4.7`              | texto       | 202,752   | GLM                     |
| `qwen/kimi-k2.5`            | texto, imagen | 262,144   | Moonshot AI vía Alibaba |
| `qwen-oauth/qwen3.5-plus`   | texto, imagen | 1,000,000 | Predeterminado de Qwen Portal |

<Note>
La disponibilidad aún puede variar según el punto de conexión y el plan de facturación, incluso cuando un modelo está
presente en el catálogo estático.
</Note>

## Controles de pensamiento

`qwen/MiniMax-M2.5` es el único modelo con razonamiento habilitado en el
catálogo integrado. Para modelos de razonamiento en la familia `qwen`, el proveedor asigna los
niveles de pensamiento de OpenClaw al indicador de solicitud de nivel superior `enable_thinking` de DashScope:
el pensamiento deshabilitado envía `enable_thinking: false`; cualquier otro nivel envía
`enable_thinking: true`. Los modelos personalizados pueden optar por una carga útil de pensamiento
alternativa de plantilla de chat configurando `compat.thinkingFormat: "qwen-chat-template"` en
la entrada del modelo.

## Complementos multimodales

El Plugin `qwen` expone capacidades multimodales solo en los puntos de conexión **Standard** de DashScope,
no en los puntos de conexión de Coding Plan:

- **Comprensión de imágenes y video** mediante `qwen-vl-max-latest`
- **Generación de video Wan** mediante `wan2.6-t2v` (predeterminado), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

La comprensión de medios se resuelve automáticamente a partir de la autenticación de Qwen configurada; no se necesita
configuración adicional. Asegúrate de estar en un punto de conexión Standard (pago por uso) para que
funcione la comprensión de medios.

Para hacer que Qwen sea el proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Límites de generación de video: 1 video de salida por solicitud, hasta 1 imagen de entrada
(imagen a video), hasta 4 videos de entrada (video a video), duración máxima de 10 segundos.
Admite `size`, `aspectRatio`, `resolution`, `audio` y
`watermark`. Las entradas de imagen/video de referencia requieren URL remotas http(s); las
rutas de archivos locales se rechazan desde el inicio porque el punto de conexión de video de DashScope no
acepta búferes locales cargados para esas referencias.

<Note>
Consulta [Generación de video](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Disponibilidad de Qwen 3.6 Plus">
    `qwen3.6-plus` está disponible en los puntos de conexión Standard (pago por uso):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Si los puntos de conexión de Coding Plan devuelven un error de "modelo no compatible" para
    `qwen3.6-plus`, cambia a Standard (pago por uso) en lugar del par de punto de conexión/clave de
    Coding Plan.

    El catálogo estático de Qwen de OpenClaw no anuncia `qwen3.6-plus` en los puntos de conexión de Coding
    Plan, pero se respeta una entrada `qwen/qwen3.6-plus` configurada explícitamente bajo
    `models.providers.qwen.models` en URLs base de Coding Plan, por lo que
    puedes optar por incluir ese modelo si Aliyun lo habilita en tu suscripción. La
    API upstream sigue decidiendo si la llamada se realiza correctamente.

  </Accordion>

  <Accordion title="Enrutamiento regional de generación de video">
    OpenClaw asigna la región de Qwen configurada al host AIGC de DashScope correspondiente
    antes de enviar un trabajo de video:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Un `models.providers.qwen.baseUrl` normal que apunte a los hosts de Coding Plan
    o Standard de Qwen sigue enrutando la generación de video al punto de conexión de video regional
    correspondiente de DashScope.

  </Accordion>

  <Accordion title="Compatibilidad de uso en streaming">
    Los puntos de conexión nativos de Qwen anuncian compatibilidad de uso en streaming en el transporte compartido
    `openai-completions`, por lo que los ids de proveedores personalizados compatibles con DashScope
    orientados a los mismos hosts nativos heredan el mismo comportamiento sin requerir
    específicamente el id del proveedor integrado `qwen`. Esto se aplica tanto a los puntos de conexión de Coding
    Plan como a los Standard:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Plan de capacidades">
    El Plugin `qwen` se está posicionando como el hogar del proveedor para toda la superficie de Qwen
    Cloud, no solo para modelos de programación/texto.

    - **Modelos de texto/chat:** disponibles a través del plugin
    - **Llamadas a herramientas, salida estructurada, razonamiento:** heredado del transporte compatible con OpenAI
    - **Generación de imágenes:** planificada en la capa de plugin de proveedor
    - **Comprensión de imágenes/video:** disponible a través del plugin en el endpoint Standard
    - **Voz/audio:** planificado en la capa de plugin de proveedor
    - **Embeddings/reranking de memoria:** planificado a través de la superficie del adaptador de embeddings
    - **Generación de video:** disponible a través del plugin mediante la capacidad compartida de generación de video

  </Accordion>

  <Accordion title="Configuración del entorno y daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `QWEN_API_KEY` esté
    disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros de la herramienta de video compartida y selección de proveedor.
  </Card>
  <Card title="Alibaba Model Studio" href="/es/providers/alibaba" icon="cloud">
    Proveedor incluido de generación de video Wan en la misma plataforma DashScope.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución de problemas general y preguntas frecuentes.
  </Card>
</CardGroup>
