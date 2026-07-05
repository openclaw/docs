---
read_when:
    - Quieres usar la generación de imágenes de fal en OpenClaw
    - Necesitas el flujo de autenticación FAL_KEY
    - Quieres valores predeterminados de fal para image_generate, video_generate o music_generate
summary: Configuración de generación de imágenes, video y música de fal en OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-05T11:37:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw incluye un proveedor `fal` integrado para generación alojada de imágenes, video y música.

| Propiedad | Valor                                                                            |
| --------- | -------------------------------------------------------------------------------- |
| Proveedor | `fal`                                                                            |
| Autenticación | `FAL_KEY` (canónico; `FAL_API_KEY` también funciona como respaldo)           |
| API       | endpoints de modelos fal (`https://fal.run`; los trabajos de video usan `https://queue.fal.run`) |
| URL base  | Sobrescribir con `models.providers.fal.baseUrl`                                  |

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Las configuraciones no interactivas pueden pasar `--fal-api-key <key>` o exportar `FAL_KEY`.
    La incorporación también configura `fal/fal-ai/flux/dev` como el modelo de imagen predeterminado cuando
    no hay ninguno configurado.

  </Step>
  <Step title="Configurar un modelo de imagen predeterminado">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Generación de imágenes

El proveedor integrado de generación de imágenes `fal` usa de forma predeterminada
`fal/fal-ai/flux/dev`.

| Capacidad      | Valor                                                              |
| -------------- | ------------------------------------------------------------------ |
| Imágenes máximas | 4 por solicitud; Krea 2: 1 por solicitud                         |
| Sobrescrituras de tamaño | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024` |
| Relación de aspecto | Admitida en todas partes excepto en Flux image-to-image       |
| Resolución     | `1K`, `2K`, `4K` (límites por modelo a continuación)               |
| Formato de salida | `png` (predeterminado) o `jpeg`; Krea 2 rechaza sobrescrituras de `outputFormat` |

Las solicitudes de edición (imágenes de referencia mediante los parámetros compartidos `image` / `images`)
se dirigen a un endpoint de edición por modelo con límites de referencia por modelo:

| Familia de modelos        | Referencia de modelo después de `fal/` | Endpoint de edición | Imágenes de referencia máximas |
| ------------------------- | -------------------------------------- | ------------------- | ------------------------------ |
| Flux y otros modelos fal  | `fal-ai/flux/dev` (predeterminado)     | `/image-to-image`   | 1                              |
| GPT Image                 | `openai/gpt-image-*`                   | `/edit`             | 10                             |
| Grok Imagine              | `xai/grok-imagine-image`               | `/edit`             | 3                              |
| Nano Banana (heredado)    | `fal-ai/nano-banana`                   | `/edit`             | 3                              |
| Nano Banana 2             | `fal-ai/nano-banana-*`                 | `/edit`             | 14                             |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`            | `/edit`             | 14                             |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image` | ninguno (refs de estilo) | 10 referencias de estilo  |

<Warning>
Las solicitudes Flux image-to-image **no** admiten sobrescrituras de `aspectRatio`. Las solicitudes de edición GPT
Image y Nano Banana 2 usan el endpoint `/edit` de fal y aceptan
sugerencias de relación de aspecto. Nano Banana 2 también acepta relaciones anchas/altas nativas adicionales
como `4:1`, `1:4`, `8:1` y `1:8`; Krea 2 valida su propio subconjunto
más pequeño de relaciones de aspecto. Grok Imagine tiene su propia lista de relaciones (incluidas `2:1`,
`20:9`, `19.5:9` y sus inversas) y solo acepta resoluciones `1K`/`2K`;
Nano Banana heredado y Nano Banana 2 Lite rechazan sobrescrituras de `resolution`.
</Warning>

Los modelos Krea 2 usan el esquema de carga nativo de Krea de fal. OpenClaw envía
`aspect_ratio`, `creativity` e `image_style_references` en lugar de la carga
genérica `image_size` / de endpoint de edición usada por Flux. Las referencias de modelo son:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Usa Medium para ilustración expresiva, anime, pintura y estilos artísticos
más rápidos. Usa Large para estilos fotorrealistas más lentos, textura cruda, grano de película y aspectos
detallados. Krea usa `fal.creativity: "medium"` de forma predeterminada; los valores admitidos son
`raw`, `low`, `medium` y `high`.

Krea 2 expone relación de aspecto, no `image_size`, en el esquema de solicitud de fal. Prefiere
`aspectRatio`; OpenClaw asigna `size` a la relación de aspecto Krea admitida más cercana
y rechaza `resolution` para Krea en lugar de descartarla.

Usa `outputFormat: "png"` cuando quieras salida PNG de modelos fal que expongan
`output_format`. fal no declara un control explícito de fondo transparente
en OpenClaw, por lo que `background: "transparent"` se informa como una sobrescritura ignorada
para modelos fal.
Los endpoints Krea 2 no exponen un campo de solicitud `output_format` mediante fal, por lo que
OpenClaw rechaza las sobrescrituras de `outputFormat` para solicitudes Krea.

Para usar Krea 2 Medium:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## Generación de video

El proveedor integrado de generación de video `fal` usa de forma predeterminada
`fal/fal-ai/minimax/video-01-live`.

| Capacidad | Valor                                                              |
| ---------- | ------------------------------------------------------------------ |
| Modos      | Texto a video, referencia de una sola imagen, Seedance de referencia a video |
| Tiempo de ejecución | Flujo de envío/estado/resultado respaldado por cola para trabajos de larga duración |
| Tiempo de espera | 20 minutos por trabajo de forma predeterminada; estado consultado cada 5 segundos |

<AccordionGroup>
  <Accordion title="Modelos de video disponibles">
    **MiniMax (predeterminado):**

    - `fal/fal-ai/minimax/video-01-live`

    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling y Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    Las solicitudes MiniMax Live y HeyGen solo envían el prompt más una imagen de referencia
    única opcional; no se reenvían otras sobrescrituras. Los modelos Seedance
    aceptan `aspectRatio`, `size`, `resolution`, duraciones de 4 a 15 segundos y
    un conmutador de audio.

  </Accordion>

  <Accordion title="Ejemplo de configuración de Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Ejemplo de configuración de Seedance 2.0 de referencia a video">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Reference-to-video acepta hasta 9 imágenes, 3 videos y 3 referencias de audio
    mediante los parámetros compartidos `video_generate` `images`, `videos` y `audioRefs`,
    con un máximo de 12 archivos de referencia en total. Las referencias de audio requieren
    al menos una referencia de imagen o video en la misma solicitud.

  </Accordion>

  <Accordion title="Ejemplo de configuración de HeyGen video-agent">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Generación de música

El Plugin integrado `fal` también registra un proveedor de generación de música para la
herramienta compartida `music_generate`.

| Capacidad    | Valor                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Modelo predeterminado | `fal/fal-ai/minimax-music/v2.6`                                                                                 |
| Modelos        | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Duración máxima | 240 segundos                                                                                                            |
| Tiempo de ejecución | Solicitud sincrónica más descarga del audio generado                                                              |

Usa fal como proveedor de música predeterminado:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` admite letras explícitas y modo instrumental,
pero no ambos en la misma solicitud. ACE-Step y Stable Audio son
endpoints de prompt a audio; elígelos con la sobrescritura `model` cuando quieras
esas familias de modelos. ACE-Step rechaza letras explícitas; Stable Audio rechaza
tanto letras como modo instrumental.

<Tip>
Las tablas y acordeones anteriores cubren las familias de modelos para las que el proveedor fal
integrado tiene tratamiento especial. Otros ids de endpoints de imagen fal aún pueden seleccionarse como
modelo de imagen; se tratan como Flux (carga genérica `image_size`, una
imagen de referencia mediante `/image-to-image`).
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados del agente, incluida la selección de modelos de imagen, video y música.
  </Card>
</CardGroup>
