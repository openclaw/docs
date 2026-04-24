---
read_when:
    - Quieres usar Qwen con OpenClaw
    - Antes usabas OAuth de Qwen
summary: Usar Qwen Cloud mediante el proveedor `qwen` incluido de OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-24T05:46:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth se ha eliminado.** La integración OAuth del nivel gratuito
(`qwen-portal`) que usaba endpoints de `portal.qwen.ai` ya no está disponible.
Consulta [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
más contexto.

</Warning>

OpenClaw ahora trata a Qwen como un proveedor incluido de primera clase con id canónico
`qwen`. El proveedor incluido apunta a los endpoints de Qwen Cloud / Alibaba DashScope y
Coding Plan y mantiene funcionando los ids heredados `modelstudio` como alias
de compatibilidad.

- Proveedor: `qwen`
- Variable de entorno preferida: `QWEN_API_KEY`
- También aceptadas por compatibilidad: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatible con OpenAI

<Tip>
Si quieres `qwen3.6-plus`, prefiere el endpoint **Standard (pay-as-you-go)**.
La compatibilidad con Coding Plan puede ir por detrás del catálogo público.
</Tip>

## Primeros pasos

Elige tu tipo de plan y sigue los pasos de configuración.

<Tabs>
  <Tab title="Coding Plan (suscripción)">
    **Ideal para:** acceso por suscripción mediante Qwen Coding Plan.

    <Steps>
      <Step title="Obtener tu clave API">
        Crea o copia una clave API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
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
    Los ids heredados de `auth-choice` `modelstudio-*` y las referencias de modelo `modelstudio/...` siguen
    funcionando como alias de compatibilidad, pero los nuevos flujos de configuración deberían preferir
    los ids canónicos de `auth-choice` `qwen-*` y las referencias de modelo `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Ideal para:** acceso de pago por uso mediante el endpoint Standard Model Studio, incluidos modelos como `qwen3.6-plus` que quizá no estén disponibles en Coding Plan.

    <Steps>
      <Step title="Obtener tu clave API">
        Crea o copia una clave API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
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
    Los ids heredados de `auth-choice` `modelstudio-*` y las referencias de modelo `modelstudio/...` siguen
    funcionando como alias de compatibilidad, pero los nuevos flujos de configuración deberían preferir
    los ids canónicos de `auth-choice` `qwen-*` y las referencias de modelo `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Tipos de plan y endpoints

| Plan                       | Región | Opción de autenticación     | Endpoint                                         |
| -------------------------- | ------ | --------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn`  | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`     | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (suscripción)  | China  | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (suscripción)  | Global | `qwen-api-key`              | `coding-intl.dashscope.aliyuncs.com/v1`          |

El proveedor selecciona automáticamente el endpoint según tu opción de autenticación. Las opciones canónicas usan la familia `qwen-*`; `modelstudio-*` queda solo por compatibilidad.
Puedes sobrescribirlo con un `baseUrl` personalizado en la configuración.

<Tip>
**Gestionar claves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentación:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

OpenClaw distribuye actualmente este catálogo Qwen incluido. El catálogo configurado
es consciente del endpoint: las configuraciones Coding Plan omiten modelos que solo se sabe que funcionan en el endpoint Standard.

| Referencia de modelo         | Entrada     | Contexto  | Notas                                                |
| ---------------------------- | ----------- | --------- | ---------------------------------------------------- |
| `qwen/qwen3.5-plus`          | texto, imagen | 1,000,000 | Modelo predeterminado                                |
| `qwen/qwen3.6-plus`          | texto, imagen | 1,000,000 | Prefiere endpoints Standard cuando necesites este modelo |
| `qwen/qwen3-max-2026-01-23`  | texto       | 262,144   | Línea Qwen Max                                       |
| `qwen/qwen3-coder-next`      | texto       | 262,144   | Coding                                               |
| `qwen/qwen3-coder-plus`      | texto       | 1,000,000 | Coding                                               |
| `qwen/MiniMax-M2.5`          | texto       | 1,000,000 | Reasoning habilitado                                 |
| `qwen/glm-5`                 | texto       | 202,752   | GLM                                                  |
| `qwen/glm-4.7`               | texto       | 202,752   | GLM                                                  |
| `qwen/kimi-k2.5`             | texto, imagen | 262,144 | Moonshot AI vía Alibaba                              |

<Note>
La disponibilidad aún puede variar según el endpoint y el plan de facturación aunque un modelo
esté presente en el catálogo incluido.
</Note>

## Extensiones multimodales

El Plugin `qwen` también expone capacidades multimodales en los endpoints DashScope **Standard**
(no en los endpoints Coding Plan):

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
Consulta [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comprensión de imágenes y video">
    El Plugin `qwen` incluido registra comprensión de medios para imágenes y video
    en los endpoints DashScope **Standard** (no en los endpoints Coding Plan).

    | Propiedad      | Valor                |
    | -------------- | -------------------- |
    | Modelo         | `qwen-vl-max-latest` |
    | Entrada compatible | Imágenes, video   |

    La comprensión de medios se resuelve automáticamente a partir de la autenticación Qwen configurada; no
    se necesita configuración adicional. Asegúrate de usar un endpoint Standard (pay-as-you-go)
    para compatibilidad con comprensión de medios.

  </Accordion>

  <Accordion title="Disponibilidad de Qwen 3.6 Plus">
    `qwen3.6-plus` está disponible en los endpoints Standard (pay-as-you-go) de Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Si los endpoints Coding Plan devuelven un error de “unsupported model” para
    `qwen3.6-plus`, cambia a Standard (pay-as-you-go) en lugar del par
    endpoint/clave de Coding Plan.

  </Accordion>

  <Accordion title="Plan de capacidades">
    El Plugin `qwen` se está posicionando como el hogar del proveedor para toda la superficie de Qwen
    Cloud, no solo para modelos de coding/texto.

    - **Modelos de texto/chat:** incluidos ahora
    - **Llamadas a herramientas, salida estructurada, thinking:** heredados del transporte compatible con OpenAI
    - **Generación de imágenes:** planificada en la capa de Plugin de proveedor
    - **Comprensión de imágenes/video:** incluida ahora en el endpoint Standard
    - **Voz/audio:** planificada en la capa de Plugin de proveedor
    - **Embeddings/reranking de memoria:** planificados mediante la superficie de adaptador de embeddings
    - **Generación de video:** incluida ahora mediante la capacidad compartida de generación de video

  </Accordion>

  <Accordion title="Detalles de generación de video">
    Para generación de video, OpenClaw asigna la región Qwen configurada al host
    DashScope AIGC correspondiente antes de enviar el trabajo:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Eso significa que un `models.providers.qwen.baseUrl` normal que apunte a cualquiera de los
    hosts Qwen Coding Plan o Standard sigue manteniendo la generación de video en el endpoint de video DashScope regional correcto.

    Límites actuales de generación de video Qwen incluidos:

    - Hasta **1** video de salida por solicitud
    - Hasta **1** imagen de entrada
    - Hasta **4** videos de entrada
    - Hasta **10 segundos** de duración
    - Compatible con `size`, `aspectRatio`, `resolution`, `audio` y `watermark`
    - El modo de imagen/video de referencia actualmente requiere **URL remotas http(s)**. Las
      rutas de archivo locales se rechazan desde el principio porque el endpoint de video de DashScope no
      acepta buffers locales subidos para esas referencias.

  </Accordion>

  <Accordion title="Compatibilidad de uso en streaming">
    Los endpoints nativos de Model Studio anuncian compatibilidad de uso en streaming sobre el
    transporte compartido `openai-completions`. OpenClaw ahora basa esto en las
    capacidades del endpoint, por lo que ids personalizados de proveedor compatibles con DashScope que apunten a los mismos hosts nativos heredan el mismo comportamiento de uso en streaming en lugar de requerir específicamente el id del proveedor integrado `qwen`.

    La compatibilidad de uso en streaming nativo se aplica tanto a los hosts Coding Plan como
    a los hosts Standard DashScope compatibles:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiones de endpoint multimodal">
    Las superficies multimodales (comprensión de video y generación de video Wan) usan
    los endpoints DashScope **Standard**, no los endpoints Coding Plan:

    - URL base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL base Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Entorno y configuración del daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `QWEN_API_KEY` esté
    disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas de video y selección de proveedor.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/es/providers/alibaba" icon="cloud">
    Proveedor heredado ModelStudio y notas de migración.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
