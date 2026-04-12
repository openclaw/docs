---
read_when:
    - Quieres usar Qwen con OpenClaw
    - Antes usabas OAuth de Qwen
summary: Usa Qwen Cloud mediante el proveedor qwen empaquetado de OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-12T23:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5247f851ef891645df6572d748ea15deeea47cd1d75858bc0d044a2930065106
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**OAuth de Qwen se ha eliminado.** La integración OAuth del nivel gratuito
(`qwen-portal`) que usaba endpoints de `portal.qwen.ai` ya no está disponible.
Consulta [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
más contexto.

</Warning>

OpenClaw ahora trata a Qwen como un proveedor empaquetado de primera clase con id canónico
`qwen`. El proveedor empaquetado apunta a los endpoints de Qwen Cloud / Alibaba DashScope y
Coding Plan, y mantiene los ids heredados `modelstudio` como alias de
compatibilidad.

- Proveedor: `qwen`
- Variable env preferida: `QWEN_API_KEY`
- También se aceptan por compatibilidad: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatible con OpenAI

<Tip>
Si quieres `qwen3.6-plus`, prefiere el endpoint **Standard (pay-as-you-go)**.
La compatibilidad con Coding Plan puede ir por detrás del catálogo público.
</Tip>

## Primeros pasos

Elige tu tipo de plan y sigue los pasos de configuración.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Ideal para:** acceso por suscripción mediante Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Crea o copia una clave API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
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
    Los ids heredados `modelstudio-*` de `auth-choice` y las referencias de modelo `modelstudio/...` siguen
    funcionando como alias de compatibilidad, pero los flujos de configuración nuevos deben preferir los ids canónicos
    `qwen-*` de `auth-choice` y las referencias de modelo `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Ideal para:** acceso de pago por uso mediante el endpoint Standard Model Studio, incluidos modelos como `qwen3.6-plus` que pueden no estar disponibles en Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Crea o copia una clave API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
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
    Los ids heredados `modelstudio-*` de `auth-choice` y las referencias de modelo `modelstudio/...` siguen
    funcionando como alias de compatibilidad, pero los flujos de configuración nuevos deben preferir los ids canónicos
    `qwen-*` de `auth-choice` y las referencias de modelo `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Tipos de plan y endpoints

| Plan                       | Región | Opción de autenticación     | Endpoint                                         |
| -------------------------- | ------ | --------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn`  | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`     | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`              | `coding-intl.dashscope.aliyuncs.com/v1`          |

El proveedor selecciona automáticamente el endpoint según tu opción de autenticación. Las
opciones canónicas usan la familia `qwen-*`; `modelstudio-*` queda solo para compatibilidad.
Puedes anularlo con un `baseUrl` personalizado en la configuración.

<Tip>
**Gestionar claves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentación:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

OpenClaw actualmente incluye este catálogo empaquetado de Qwen. El catálogo configurado
reconoce el endpoint: las configuraciones de Coding Plan omiten modelos que solo se sabe que funcionan en
el endpoint Standard.

| Model ref                   | Entrada     | Contexto  | Notas                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Modelo predeterminado                              |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Prefiere endpoints Standard cuando necesites este modelo |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Línea Qwen Max                                     |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Razonamiento habilitado                            |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI vía Alibaba                            |

<Note>
La disponibilidad aún puede variar según el endpoint y el plan de facturación, incluso cuando un modelo está
presente en el catálogo empaquetado.
</Note>

## Complementos multimodales

La extensión `qwen` también expone capacidades multimodales en los endpoints **Standard**
de DashScope (no en los endpoints de Coding Plan):

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
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de herramientas, la selección de proveedores y el comportamiento de failover.
</Note>

## Avanzado

<AccordionGroup>
  <Accordion title="Image and video understanding">
    El plugin empaquetado de Qwen registra comprensión de medios para imágenes y video
    en los endpoints **Standard** de DashScope (no en los endpoints de Coding Plan).

    | Propiedad         | Valor                |
    | ----------------- | -------------------- |
    | Modelo            | `qwen-vl-max-latest` |
    | Entrada compatible | Imágenes, video     |

    La comprensión de medios se resuelve automáticamente a partir de la autenticación configurada de Qwen; no
    se necesita configuración adicional. Asegúrate de usar un endpoint Standard (pay-as-you-go)
    para compatibilidad con comprensión de medios.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` está disponible en los endpoints Standard (pay-as-you-go) de Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Si los endpoints de Coding Plan devuelven un error de "unsupported model" para
    `qwen3.6-plus`, cambia a Standard (pay-as-you-go) en lugar de la combinación
    endpoint/clave de Coding Plan.

  </Accordion>

  <Accordion title="Capability plan">
    La extensión `qwen` se está posicionando como el hogar del proveedor para toda la superficie de Qwen
    Cloud, no solo para modelos de coding/texto.

    - **Modelos de texto/chat:** empaquetados ahora
    - **Llamada a herramientas, salida estructurada, thinking:** heredados del transporte compatible con OpenAI
    - **Generación de imágenes:** planificada en la capa del Plugin de proveedor
    - **Comprensión de imagen/video:** empaquetada ahora en el endpoint Standard
    - **Voz/audio:** planificada en la capa del Plugin de proveedor
    - **Embeddings/reranking de memoria:** planificados mediante la superficie del adaptador de embeddings
    - **Generación de video:** empaquetada ahora mediante la capacidad compartida de generación de video

  </Accordion>

  <Accordion title="Video generation details">
    Para la generación de video, OpenClaw asigna la región configurada de Qwen al host
    AIGC de DashScope correspondiente antes de enviar el trabajo:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Eso significa que un `models.providers.qwen.baseUrl` normal que apunte a cualquiera de los
    hosts Qwen de Coding Plan o Standard sigue manteniendo la generación de video en el endpoint regional correcto
    de video de DashScope.

    Límites actuales de generación de video del Qwen empaquetado:

    - Hasta **1** video de salida por solicitud
    - Hasta **1** imagen de entrada
    - Hasta **4** videos de entrada
    - Hasta **10 segundos** de duración
    - Compatible con `size`, `aspectRatio`, `resolution`, `audio` y `watermark`
    - El modo de imagen/video de referencia actualmente requiere **URLs remotas http(s)**. Las
      rutas de archivos locales se rechazan de inmediato porque el endpoint de video de DashScope no
      acepta búferes locales cargados para esas referencias.

  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Los endpoints nativos de Model Studio anuncian compatibilidad de uso en streaming en el
    transporte compartido `openai-completions`. OpenClaw ahora basa esto en las capacidades del endpoint,
    por lo que los ids de proveedor personalizados compatibles con DashScope que apunten a los
    mismos hosts nativos heredan el mismo comportamiento de uso en streaming en lugar de
    requerir específicamente el id del proveedor integrado `qwen`.

    La compatibilidad de uso en streaming nativo se aplica tanto a los hosts de Coding Plan como
    a los hosts Standard compatibles con DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Multimodal endpoint regions">
    Las superficies multimodales (comprensión de video y generación de video Wan) usan los
    endpoints **Standard** de DashScope, no los endpoints de Coding Plan:

    - Base URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Base URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `QWEN_API_KEY` esté
    disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas de video y selección de proveedores.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/es/providers/alibaba" icon="cloud">
    Proveedor heredado de ModelStudio y notas de migración.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
