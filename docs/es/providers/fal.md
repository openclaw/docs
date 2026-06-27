---
read_when:
    - Quieres usar la generación de imágenes de fal en OpenClaw
    - Necesitas el flujo de autenticación de FAL_KEY
    - Quieres valores predeterminados de fal para image_generate, video_generate o music_generate
summary: Configuración de generación de imágenes, video y música con fal en OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T12:36:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw incluye un proveedor `fal` integrado para generación alojada de imágenes, video y música.

| Propiedad | Valor                                                         |
| -------- | ------------------------------------------------------------- |
| Proveedor | `fal`                                                         |
| Autenticación     | `FAL_KEY` (canónico; `FAL_API_KEY` también funciona como alternativa) |
| API      | puntos de conexión de modelos fal                                           |

## Primeros pasos

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Set a default image model">
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

| Capacidad     | Valor                                                              |
| -------------- | ------------------------------------------------------------------ |
| Máximo de imágenes     | 4 por solicitud; Krea 2: 1 por solicitud                               |
| Modo de edición      | Flux: 1 imagen de referencia; GPT Image 2: 10; Nano Banana 2: 14        |
| Referencias de estilo     | Krea 2: hasta 10 referencias de estilo mediante `image` / `images`           |
| Anulaciones de tamaño | Compatible                                                          |
| Relación de aspecto   | Compatible para generar, Krea 2 y edición de GPT Image 2/Nano Banana 2 |
| Resolución     | Compatible                                                          |
| Formato de salida  | `png` o `jpeg`                                                    |

<Warning>
Las solicitudes de imagen a imagen de Flux **no** admiten anulaciones de `aspectRatio`. Las solicitudes de edición de GPT
Image 2 y Nano Banana 2 usan el punto de conexión `/edit` de fal y aceptan
pistas de relación de aspecto. Nano Banana 2 también acepta relaciones anchas/altas nativas adicionales
como `4:1`, `1:4`, `8:1` y `1:8`; Krea 2 valida su propio subconjunto más pequeño
de relaciones de aspecto.
</Warning>

Los modelos Krea 2 usan el esquema de carga útil nativo de Krea en fal. OpenClaw envía
`aspect_ratio`, `creativity` e `image_style_references` en lugar de la carga útil
genérica de `image_size` / punto de conexión de edición usada por Flux. Las referencias de modelo son:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Usa Medium para ilustración expresiva más rápida, anime, pintura y estilos
artísticos. Usa Large para aspectos más lentos fotorrealistas, textura cruda, grano de película y
detallados. Krea usa de forma predeterminada `fal.creativity: "medium"`; los valores compatibles son
`raw`, `low`, `medium` y `high`.

Krea 2 expone relación de aspecto, no `image_size`, en el esquema de solicitud de fal. Prefiere
`aspectRatio`; OpenClaw asigna `size` a la relación de aspecto Krea compatible más cercana
y rechaza `resolution` para Krea en lugar de descartarla.

Usa `outputFormat: "png"` cuando quieras salida PNG de modelos fal que exponen
`output_format`. fal no declara un control explícito de fondo transparente
en OpenClaw, por lo que `background: "transparent"` se informa como una anulación ignorada
para modelos fal.
Los puntos de conexión de Krea 2 no exponen un campo de solicitud `output_format` mediante fal, por lo que
OpenClaw rechaza anulaciones de `outputFormat` para solicitudes de Krea.

Para usar fal como proveedor de imágenes predeterminado:

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
| Modos      | Texto a video, referencia de una sola imagen, referencia a video de Seedance |
| Entorno de ejecución    | Flujo de envío/estado/resultado respaldado por cola para trabajos de larga duración       |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 config example">
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

  <Accordion title="Seedance 2.0 reference-to-video config example">
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

    Referencia a video acepta hasta 9 imágenes, 3 videos y 3 referencias de audio
    mediante los parámetros compartidos `video_generate` `images`, `videos` y `audioRefs`,
    con un máximo de 12 archivos de referencia en total.

  </Accordion>

  <Accordion title="HeyGen video-agent config example">
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

| Capacidad    | Valor                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Modelo predeterminado | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| Modelos        | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Entorno de ejecución       | Solicitud síncrona más descarga del audio generado                                                      |

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

`fal-ai/minimax-music/v2.6` admite letras explícitas y modo instrumental.
ACE-Step y Stable Audio son puntos de conexión de prompt a audio; elígelos con la
anulación `model` cuando quieras esas familias de modelos.

<Tip>
Usa `openclaw models list --provider fal` para ver la lista completa de modelos fal
disponibles, incluidas las entradas agregadas recientemente.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Image generation" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imagen y selección de proveedor.
  </Card>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Music generation" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados del agente, incluida la selección de modelos de imagen, video y música.
  </Card>
</CardGroup>
