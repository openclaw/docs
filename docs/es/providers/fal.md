---
read_when:
    - Quieres usar la generación de imágenes de fal en OpenClaw
    - Necesitas el flujo de autenticación de `FAL_KEY`
    - Quieres los valores predeterminados de fal para `image_generate`, `video_generate` o `music_generate`
summary: Configuración de generación de imágenes, vídeos y música de fal en OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-11T23:26:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw incluye un proveedor `fal` integrado para la generación alojada de imágenes, vídeos y música.

| Propiedad | Valor                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------- |
| Proveedor | `fal`                                                                                          |
| Autenticación | `FAL_KEY` (canónica; `FAL_API_KEY` también funciona como alternativa)                      |
| API       | Endpoints de modelos de fal (`https://fal.run`; los trabajos de vídeo usan `https://queue.fal.run`) |
| URL base  | Se reemplaza con `models.providers.fal.baseUrl`                                                |

## Primeros pasos

<Steps>
  <Step title="Establecer la clave de API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Las configuraciones no interactivas pueden proporcionar `--fal-api-key <key>` o exportar `FAL_KEY`.
    La incorporación también establece `fal/fal-ai/flux/dev` como modelo de imagen predeterminado cuando
    no hay ninguno configurado.

  </Step>
  <Step title="Establecer un modelo de imagen predeterminado">
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

El proveedor `fal` integrado para la generación de imágenes usa de forma predeterminada
`fal/fal-ai/flux/dev`.

| Capacidad                  | Valor                                                                    |
| -------------------------- | ------------------------------------------------------------------------ |
| Máximo de imágenes         | 4 por solicitud; Krea 2: 1 por solicitud                                 |
| Reemplazos de tamaño       | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`          |
| Relación de aspecto        | Compatible en todas partes excepto en la conversión de imagen a imagen de Flux |
| Resolución                 | `1K`, `2K`, `4K` (límites por modelo indicados a continuación)           |
| Formato de salida          | `png` (predeterminado) o `jpeg`; Krea 2 rechaza los reemplazos de `outputFormat` |

Las solicitudes de edición (imágenes de referencia mediante los parámetros compartidos `image` / `images`)
se dirigen a un endpoint de edición específico de cada modelo, con límites de referencias por modelo:

| Familia de modelos         | Referencia del modelo después de `fal/`  | Endpoint de edición | Máximo de imágenes de referencia |
| -------------------------- | ---------------------------------------- | ------------------- | ------------------------------- |
| Flux y otros modelos de fal | `fal-ai/flux/dev` (predeterminado)      | `/image-to-image`   | 1                               |
| GPT Image                  | `openai/gpt-image-*`                     | `/edit`             | 10                              |
| Grok Imagine               | `xai/grok-imagine-image`                 | `/edit`             | 3                               |
| Nano Banana (heredado)     | `fal-ai/nano-banana`                     | `/edit`             | 3                               |
| Nano Banana 2              | `fal-ai/nano-banana-*`                   | `/edit`             | 14                              |
| Nano Banana 2 Lite         | `google/nano-banana-2-lite`              | `/edit`             | 14                              |
| Krea 2                     | `krea/v2/{medium,large}/text-to-image`   | ninguno (referencias de estilo) | 10 referencias de estilo |

<Warning>
Las solicitudes de imagen a imagen de Flux **no** admiten reemplazos de `aspectRatio`. Las solicitudes de edición de GPT
Image y Nano Banana 2 usan el endpoint `/edit` de fal y aceptan
indicaciones de relación de aspecto. Nano Banana 2 también admite relaciones panorámicas o verticales nativas adicionales,
como `4:1`, `1:4`, `8:1` y `1:8`; Krea 2 valida su propio subconjunto más reducido
de relaciones de aspecto. Grok Imagine tiene su propia lista de relaciones (incluidas `2:1`,
`20:9`, `19.5:9` y sus inversas) y solo admite resoluciones `1K`/`2K`;
Nano Banana heredado y Nano Banana 2 Lite rechazan los reemplazos de `resolution`.
</Warning>

Los modelos Krea 2 usan el esquema de carga útil nativo de Krea en fal. OpenClaw envía
`aspect_ratio`, `creativity` e `image_style_references` en lugar de la
carga útil genérica de `image_size` / endpoint de edición que usa Flux. Las referencias de los modelos son:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Use Medium para ilustraciones expresivas, anime, pintura y estilos artísticos con mayor rapidez.
Use Large para resultados fotorrealistas más lentos, texturas sin procesar, grano de película y acabados
detallados. El valor predeterminado de Krea es `fal.creativity: "medium"`; los valores compatibles son
`raw`, `low`, `medium` y `high`.

Krea 2 expone la relación de aspecto, no `image_size`, en el esquema de solicitud de fal. Se recomienda
`aspectRatio`; OpenClaw asigna `size` a la relación de aspecto de Krea compatible más cercana
y rechaza `resolution` para Krea en lugar de descartarla.

Use `outputFormat: "png"` cuando quiera obtener una salida PNG de los modelos de fal que exponen
`output_format`. fal no declara un control explícito de fondo transparente
en OpenClaw, por lo que `background: "transparent"` se informa como un
reemplazo ignorado para los modelos de fal.
Los endpoints de Krea 2 no exponen un campo de solicitud `output_format` mediante fal, por lo que
OpenClaw rechaza los reemplazos de `outputFormat` en las solicitudes de Krea.

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

## Generación de vídeos

El proveedor `fal` integrado para la generación de vídeos usa de forma predeterminada
`fal/fal-ai/minimax/video-01-live`.

| Capacidad | Valor                                                                            |
| --------- | -------------------------------------------------------------------------------- |
| Modos     | Texto a vídeo, referencia de una sola imagen, referencia a vídeo con Seedance    |
| Ejecución | Flujo de envío, estado y resultado respaldado por una cola para trabajos de larga duración |
| Tiempo de espera | 20 minutos por trabajo de forma predeterminada; el estado se consulta cada 5 segundos |

<AccordionGroup>
  <Accordion title="Modelos de vídeo disponibles">
    **MiniMax (predeterminado):**

    - `fal/fal-ai/minimax/video-01-live`

    **Agente de vídeo de HeyGen:**

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

    Las solicitudes de MiniMax Live y HeyGen solo envían la instrucción y una imagen de referencia
    única opcional; no se reenvían otros reemplazos. Los modelos Seedance
    admiten `aspectRatio`, `size`, `resolution`, duraciones de 4 a 15 segundos y
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

  <Accordion title="Ejemplo de configuración de referencia a vídeo con Seedance 2.0">
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

    La conversión de referencia a vídeo admite hasta 9 imágenes, 3 vídeos y 3 referencias de audio
    mediante los parámetros compartidos `images`, `videos` y `audioRefs` de `video_generate`,
    con un máximo de 12 archivos de referencia en total. Las referencias de audio requieren
    al menos una referencia de imagen o vídeo en la misma solicitud.

  </Accordion>

  <Accordion title="Ejemplo de configuración del agente de vídeo de HeyGen">
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

El Plugin `fal` integrado también registra un proveedor de generación de música para la
herramienta compartida `music_generate`.

| Capacidad                | Valor                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Modelo predeterminado    | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| Modelos                  | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Duración máxima          | 240 segundos                                                                                                             |
| Ejecución                | Solicitud síncrona y descarga del audio generado                                                                         |

Use fal como proveedor de música predeterminado:

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
endpoints de instrucción a audio; selecciónelos mediante el reemplazo `model` cuando quiera
usar esas familias de modelos. ACE-Step rechaza las letras explícitas; Stable Audio rechaza
tanto las letras como el modo instrumental.

<Tip>
Las tablas y los acordeones anteriores abarcan las familias de modelos que el proveedor fal
integrado trata de forma especial. También se pueden seleccionar otros identificadores de endpoints de imágenes de fal
como modelo de imagen; se tratan como Flux (carga útil genérica `image_size`, una
imagen de referencia mediante `/image-to-image`).
</Tip>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección del proveedor.
  </Card>
  <Card title="Generación de vídeos" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeos y selección del proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección del proveedor.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados del agente, incluida la selección de modelos de imagen, vídeo y música.
  </Card>
</CardGroup>
