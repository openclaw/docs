---
read_when:
    - Quieres usar Qwen con OpenClaw
    - Anteriormente usaste OAuth de Qwen
summary: Usa Qwen Cloud mediante su plugin de OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-06-27T12:43:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw ahora trata a Qwen como un Plugin de proveedor de primera clase con el id canónico
`qwen`. El Plugin de proveedor apunta a los endpoints de Qwen Cloud / Alibaba DashScope y
Coding Plan, mantiene funcionando los ids heredados `modelstudio` como alias de compatibilidad
y también expone el flujo de token de Qwen Portal como proveedor `qwen-oauth`.

- Proveedor: `qwen`
- Proveedor Portal: [`qwen-oauth`](/es/providers/qwen-oauth)
- Variable de entorno preferida: `QWEN_API_KEY`
- También se acepta por compatibilidad: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatible con OpenAI

<Tip>
Si quieres `qwen3.6-plus`, prefiere el endpoint **Standard (pay-as-you-go)**.
La compatibilidad con Coding Plan puede ir por detrás del catálogo público.
</Tip>

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Primeros pasos

Elige tu tipo de plan y sigue los pasos de configuración.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Ideal para:** acceso basado en suscripción mediante Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Crea o copia una clave de API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Para el endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Para el endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Los ids heredados de auth-choice `modelstudio-*` y las referencias de modelo `modelstudio/...` todavía
    funcionan como alias de compatibilidad, pero los nuevos flujos de configuración deberían preferir los ids canónicos de auth-choice
    `qwen-*` y las referencias de modelo `qwen/...`. Si defines una entrada
    personalizada exacta `models.providers.modelstudio` con otro valor de `api`, ese
    proveedor personalizado posee las referencias `modelstudio/...` en lugar del alias de compatibilidad
    de Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Ideal para:** acceso de pago por uso mediante el endpoint Standard Model Studio, incluidos modelos como `qwen3.6-plus` que podrían no estar disponibles en Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Crea o copia una clave de API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Para el endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Para el endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Los ids heredados de auth-choice `modelstudio-*` y las referencias de modelo `modelstudio/...` todavía
    funcionan como alias de compatibilidad, pero los nuevos flujos de configuración deberían preferir los ids canónicos de auth-choice
    `qwen-*` y las referencias de modelo `qwen/...`. Si defines una entrada
    personalizada exacta `models.providers.modelstudio` con otro valor de `api`, ese
    proveedor personalizado posee las referencias `modelstudio/...` en lugar del alias de compatibilidad
    de Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Ideal para:** un token de Qwen Portal contra `https://portal.qwen.ai/v1`.

    Consulta [Qwen OAuth / Portal](/es/providers/qwen-oauth) para ver la página dedicada del proveedor
    y las notas de migración.

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` usa el mismo nombre de variable de entorno `QWEN_API_KEY` que el proveedor
    DashScope, pero almacena la autenticación bajo el id de proveedor `qwen-oauth` cuando se configura
    mediante el onboarding de OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Tipos de plan y endpoints

| Plan                       | Región | Opción de autenticación     | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

El proveedor selecciona automáticamente el endpoint según tu opción de autenticación. Las opciones
canónicas usan la familia `qwen-*`; `modelstudio-*` se conserva solo por compatibilidad.
Puedes sobrescribirlo con un `baseUrl` personalizado en la configuración.

<Tip>
**Gestionar claves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentación:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

OpenClaw actualmente incluye este catálogo estático de Qwen. El catálogo configurado es
consciente del endpoint: las configuraciones de Coding Plan omiten los modelos que solo se sabe que funcionan en
el endpoint Standard.

| Ref. de modelo              | Entrada     | Contexto  | Notas                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | texto, imagen | 1,000,000 | Modelo predeterminado                              |
| `qwen/qwen3.6-plus`         | texto, imagen | 1,000,000 | Prefiere endpoints Standard cuando necesites este modelo |
| `qwen/qwen3-max-2026-01-23` | texto       | 262,144   | Línea Qwen Max                                     |
| `qwen/qwen3-coder-next`     | texto       | 262,144   | Codificación                                       |
| `qwen/qwen3-coder-plus`     | texto       | 1,000,000 | Codificación                                       |
| `qwen/MiniMax-M2.5`         | texto       | 1,000,000 | Razonamiento habilitado                            |
| `qwen/glm-5`                | texto       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | texto       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | texto, imagen | 262,144   | Moonshot AI a través de Alibaba                    |
| `qwen-oauth/qwen3.5-plus`   | texto, imagen | 1,000,000 | Predeterminado de Qwen Portal                      |

<Note>
La disponibilidad aún puede variar según el endpoint y el plan de facturación, incluso cuando un modelo está
presente en el catálogo estático.
</Note>

## Controles de pensamiento

Para los modelos de Qwen Cloud con razonamiento habilitado, el proveedor asigna los
niveles de pensamiento de OpenClaw al indicador de solicitud de nivel superior `enable_thinking` de DashScope. El pensamiento deshabilitado
envía `enable_thinking: false`; otros niveles de pensamiento envían
`enable_thinking: true`.

## Complementos multimodales

El plugin `qwen` también expone capacidades multimodales en los endpoints
DashScope **Standard** (no en los endpoints de Coding Plan):

- **Comprensión de video** mediante `qwen-vl-max-latest`
- **Generación de video Wan** mediante `wan2.6-t2v` (predeterminado), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Para usar Qwen como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Image and video understanding">
    El plugin Qwen registra comprensión de medios para imágenes y video
    en los endpoints DashScope **Standard** (no en los endpoints de Coding Plan).

    | Propiedad      | Valor                 |
    | ------------- | --------------------- |
    | Modelo         | `qwen-vl-max-latest`  |
    | Entrada admitida | Imágenes, video     |

    La comprensión de medios se resuelve automáticamente a partir de la autenticación de Qwen configurada; no se
    necesita configuración adicional. Asegúrate de usar un endpoint Standard (pago por uso)
    para la compatibilidad con comprensión de medios.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` está disponible en los endpoints Standard (pago por uso) de Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Si los endpoints de Coding Plan devuelven un error de "modelo no admitido" para
    `qwen3.6-plus`, cambia a Standard (pago por uso) en lugar del par de endpoint/clave de
    Coding Plan.

    El catálogo estático de Qwen de OpenClaw no anuncia `qwen3.6-plus` en endpoints de Coding
    Plan, pero las entradas `qwen/qwen3.6-plus` configuradas explícitamente bajo
    `models.providers.qwen.models` se respetan en `baseUrls` de Coding Plan para que
    puedas habilitar ese modelo si Aliyun lo habilita en tu suscripción. La
    API de origen aún decide si la llamada se realiza correctamente.

  </Accordion>

  <Accordion title="Capability plan">
    El plugin `qwen` se está posicionando como el hogar del proveedor para toda la superficie de
    Qwen Cloud, no solo para modelos de codificación/texto.

    - **Modelos de texto/chat:** disponibles a través del plugin
    - **Llamadas a herramientas, salida estructurada, pensamiento:** heredados del transporte compatible con OpenAI
    - **Generación de imágenes:** planificada en la capa de plugin de proveedor
    - **Comprensión de imágenes/video:** disponible a través del plugin en el endpoint Standard
    - **Voz/audio:** planificado en la capa de plugin de proveedor
    - **Embeddings/reordenación de Memory:** planificados a través de la superficie del adaptador de embeddings
    - **Generación de video:** disponible a través del plugin mediante la capacidad compartida de generación de video

  </Accordion>

  <Accordion title="Video generation details">
    Para la generación de video, OpenClaw asigna la región de Qwen configurada al host
    DashScope AIGC correspondiente antes de enviar el trabajo:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Eso significa que un `models.providers.qwen.baseUrl` normal que apunte a los hosts de
    Coding Plan o Standard de Qwen aún mantiene la generación de video en el endpoint de video
    regional correcto de DashScope.

    Límites actuales de generación de video de Qwen:

    - Hasta **1** video de salida por solicitud
    - Hasta **1** imagen de entrada
    - Hasta **4** videos de entrada
    - Hasta **10 segundos** de duración
    - Admite `size`, `aspectRatio`, `resolution`, `audio` y `watermark`
    - El modo de imagen/video de referencia actualmente requiere **URL http(s) remotas**. Las rutas de
      archivos locales se rechazan de entrada porque el endpoint de video de DashScope no
      acepta búferes locales cargados para esas referencias.

  </Accordion>

  <Accordion title="Compatibilidad de uso en streaming">
    Los endpoints nativos de Model Studio anuncian compatibilidad de uso en streaming en el
    transporte compartido `openai-completions`. OpenClaw ahora determina eso a partir de las
    capacidades del endpoint, de modo que los ids de proveedores personalizados compatibles con DashScope que apuntan a los
    mismos hosts nativos heredan el mismo comportamiento de uso en streaming en lugar de
    requerir específicamente el id del proveedor integrado `qwen`.

    La compatibilidad de uso con streaming nativo se aplica tanto a los hosts de Coding Plan como
    a los hosts estándar compatibles con DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiones de endpoints multimodales">
    Las superficies multimodales (comprensión de video y generación de video Wan) usan los
    endpoints **Estándar** de DashScope, no los endpoints de Coding Plan:

    - URL base estándar global/internacional: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL base estándar de China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configuración de entorno y daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `QWEN_API_KEY` esté
    disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, refs de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/es/providers/alibaba" icon="cloud">
    Proveedor heredado de ModelStudio y notas de migración.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución de problemas general y preguntas frecuentes.
  </Card>
</CardGroup>
