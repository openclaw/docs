---
read_when:
    - Quieres usar Qwen con OpenClaw
    - Has usado Qwen OAuth anteriormente
summary: Usa Qwen Cloud mediante el proveedor qwen incluido de OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T14:07:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Se ha eliminado Qwen OAuth.** La integración OAuth de nivel gratuito
(`qwen-portal`) que usaba endpoints de `portal.qwen.ai` ya no está disponible.
Consulta [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
más contexto.

</Warning>

OpenClaw ahora trata Qwen como un proveedor incluido de primera clase con el id canónico
`qwen`. El proveedor incluido apunta a los endpoints de Qwen Cloud / Alibaba DashScope y
Coding Plan, y mantiene los ids heredados de `modelstudio` funcionando como
alias de compatibilidad.

- Proveedor: `qwen`
- Variable de entorno preferida: `QWEN_API_KEY`
- También se aceptan por compatibilidad: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatible con OpenAI

<Tip>
Si quieres `qwen3.6-plus`, prefiere el endpoint **Standard (pago por uso)**.
La compatibilidad con Coding Plan puede ir por detrás del catálogo público.
</Tip>

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
        Para el endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Para el endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Establece un modelo predeterminado">
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
    Los ids heredados `modelstudio-*` de auth-choice y las referencias de modelo `modelstudio/...` siguen
    funcionando como alias de compatibilidad, pero los nuevos flujos de configuración deben preferir los ids canónicos
    `qwen-*` de auth-choice y las referencias de modelo `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pago por uso)">
    **Ideal para:** acceso de pago por uso mediante el endpoint Standard Model Studio, incluidos modelos como `qwen3.6-plus` que puede que no estén disponibles en Coding Plan.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea o copia una clave de API desde [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Ejecuta la incorporación">
        Para el endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Para el endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Establece un modelo predeterminado">
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
    Los ids heredados `modelstudio-*` de auth-choice y las referencias de modelo `modelstudio/...` siguen
    funcionando como alias de compatibilidad, pero los nuevos flujos de configuración deben preferir los ids canónicos
    `qwen-*` de auth-choice y las referencias de modelo `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Tipos de plan y endpoints

| Plan                       | Región | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pago por uso)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pago por uso)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (suscripción) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (suscripción) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

El proveedor selecciona automáticamente el endpoint según tu auth choice. Las elecciones canónicas
usan la familia `qwen-*`; `modelstudio-*` sigue siendo solo de compatibilidad.
Puedes reemplazarlo con un `baseUrl` personalizado en la configuración.

<Tip>
**Gestionar claves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentación:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo incluido

OpenClaw incluye actualmente este catálogo de Qwen. El catálogo configurado es
consciente del endpoint: las configuraciones de Coding Plan omiten modelos que solo se sabe que funcionan en
el endpoint Standard.

| Referencia de modelo          | Entrada     | Contexto   | Notas                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | texto, imagen | 1,000,000 | Modelo predeterminado                                      |
| `qwen/qwen3.6-plus`         | texto, imagen | 1,000,000 | Prefiere endpoints Standard cuando necesites este modelo |
| `qwen/qwen3-max-2026-01-23` | texto        | 262,144   | Línea Qwen Max                                      |
| `qwen/qwen3-coder-next`     | texto        | 262,144   | Programación                                             |
| `qwen/qwen3-coder-plus`     | texto        | 1,000,000 | Programación                                             |
| `qwen/MiniMax-M2.5`         | texto        | 1,000,000 | Razonamiento habilitado                                  |
| `qwen/glm-5`                | texto        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | texto        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | texto, imagen | 262,144   | Moonshot AI mediante Alibaba                            |

<Note>
La disponibilidad puede seguir variando según el endpoint y el plan de facturación, incluso cuando un modelo esté
presente en el catálogo incluido.
</Note>

## Complementos multimodales

El Plugin `qwen` también expone capacidades multimodales en los endpoints DashScope **Standard**
(no en los endpoints Coding Plan):

- **Comprensión de vídeo** mediante `qwen-vl-max-latest`
- **Generación de vídeo Wan** mediante `wan2.6-t2v` (predeterminado), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Para usar Qwen como proveedor de vídeo predeterminado:

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
Consulta [Video Generation](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
</Note>

## Avanzado

<AccordionGroup>
  <Accordion title="Comprensión de imágenes y vídeo">
    El Plugin Qwen incluido registra la comprensión de contenido multimedia para imágenes y vídeo
    en los endpoints DashScope **Standard** (no en los endpoints Coding Plan).

    | Propiedad      | Valor                 |
    | ------------- | --------------------- |
    | Modelo         | `qwen-vl-max-latest`  |
    | Entrada compatible | Imágenes, vídeo       |

    La comprensión de contenido multimedia se resuelve automáticamente a partir de la autenticación Qwen configurada; no
    se necesita configuración adicional. Asegúrate de estar usando un endpoint Standard (pago por uso)
    para la compatibilidad con comprensión de contenido multimedia.

  </Accordion>

  <Accordion title="Disponibilidad de Qwen 3.6 Plus">
    `qwen3.6-plus` está disponible en los endpoints Standard (pago por uso) de Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Si los endpoints Coding Plan devuelven un error de "unsupported model" para
    `qwen3.6-plus`, cambia a Standard (pago por uso) en lugar del par
    endpoint/clave de Coding Plan.

  </Accordion>

  <Accordion title="Plan de capacidades">
    El Plugin `qwen` se está posicionando como el hogar del proveedor para toda la superficie de Qwen
    Cloud, no solo para modelos de programación/texto.

    - **Modelos de texto/chat:** incluidos ahora
    - **Llamadas a herramientas, salida estructurada, thinking:** heredados del transporte compatible con OpenAI
    - **Generación de imágenes:** prevista en la capa del Plugin de proveedor
    - **Comprensión de imágenes/vídeo:** incluida ahora en el endpoint Standard
    - **Voz/audio:** prevista en la capa del Plugin de proveedor
    - **Embeddings/reranking de memoria:** previstos mediante la superficie del adaptador de embeddings
    - **Generación de vídeo:** incluida ahora mediante la capacidad compartida de generación de vídeo

  </Accordion>

  <Accordion title="Detalles de generación de vídeo">
    Para la generación de vídeo, OpenClaw asigna la región Qwen configurada al host
    AIGC de DashScope correspondiente antes de enviar el trabajo:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Esto significa que una `models.providers.qwen.baseUrl` normal que apunte a cualquiera de los
    hosts de Qwen Coding Plan o Standard sigue manteniendo la generación de vídeo en el endpoint
    de vídeo regional correcto de DashScope.

    Límites actuales incluidos de generación de vídeo Qwen:

    - Hasta **1** vídeo de salida por solicitud
    - Hasta **1** imagen de entrada
    - Hasta **4** vídeos de entrada
    - Hasta **10 segundos** de duración
    - Admite `size`, `aspectRatio`, `resolution`, `audio` y `watermark`
    - El modo de imagen/vídeo de referencia actualmente requiere **URLs remotas http(s)**. Las rutas de archivos locales se rechazan de inmediato porque el endpoint de vídeo de DashScope no
      acepta buffers locales cargados para esas referencias.

  </Accordion>

  <Accordion title="Compatibilidad con uso de streaming">
    Los endpoints nativos de Model Studio anuncian compatibilidad con uso de streaming en el
    transporte compartido `openai-completions`. OpenClaw se basa ahora en las capacidades del endpoint,
    por lo que los ids de proveedores personalizados compatibles con DashScope que apunten a los
    mismos hosts nativos heredan el mismo comportamiento de uso de streaming en lugar de
    requerir específicamente el id del proveedor `qwen` integrado.

    La compatibilidad con uso de streaming nativo se aplica tanto a los hosts de Coding Plan como a
    los hosts Standard compatibles con DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiones de endpoints multimodales">
    Las superficies multimodales (comprensión de vídeo y generación de vídeo Wan) usan los
    endpoints DashScope **Standard**, no los endpoints Coding Plan:

    - URL base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL base Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configuración de entorno y daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `QWEN_API_KEY` esté
    disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedor.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/es/providers/alibaba" icon="cloud">
    Proveedor heredado de ModelStudio y notas de migración.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
