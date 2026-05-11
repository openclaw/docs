---
read_when:
    - Quieres usar la generación de imágenes de fal en OpenClaw
    - Necesitas el flujo de autenticación de FAL_KEY
    - Quieres los valores predeterminados de fal para image_generate o video_generate
summary: Configuración de generación de imágenes y video de fal en OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:50:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw incluye un proveedor `fal` integrado para generación alojada de imágenes y video.

| Propiedad | Valor                                                         |
| -------- | ------------------------------------------------------------- |
| Proveedor | `fal`                                                         |
| Autenticación | `FAL_KEY` (canónica; `FAL_API_KEY` también funciona como alternativa) |
| API      | Endpoints de modelos fal                                      |

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
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

| Capacidad        | Valor                                                       |
| -------------- | ----------------------------------------------------------- |
| Imágenes máximas | 4 por solicitud                                             |
| Modo de edición  | Flux: 1 imagen de referencia; GPT Image 2: 10; Nano Banana 2: 14 |
| Sustituciones de tamaño | Compatibles                                          |
| Relación de aspecto | Compatible para generación y edición de GPT Image 2/Nano Banana 2 |
| Resolución     | Compatible                                                  |
| Formato de salida | `png` o `jpeg`                                           |

<Warning>
Las solicitudes de imagen a imagen de Flux **no** admiten sustituciones de
`aspectRatio`. Las solicitudes de edición de GPT Image 2 y Nano Banana 2 usan el
endpoint `/edit` de fal y aceptan indicaciones de relación de aspecto.
</Warning>

Usa `outputFormat: "png"` cuando quieras una salida PNG. fal no declara un
control explícito de fondo transparente en OpenClaw, por lo que `background:
"transparent"` se informa como una sustitución ignorada para los modelos fal.

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

## Generación de video

El proveedor integrado de generación de video `fal` usa de forma predeterminada
`fal/fal-ai/minimax/video-01-live`.

| Capacidad | Valor                                                              |
| ---------- | ------------------------------------------------------------------ |
| Modos      | Texto a video, referencia de una sola imagen, referencia a video de Seedance |
| Runtime    | Flujo de envío/estado/resultado respaldado por cola para trabajos de larga duración |

<AccordionGroup>
  <Accordion title="Modelos de video disponibles">
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

  <Accordion title="Ejemplo de configuración de referencia a video de Seedance 2.0">
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
    mediante los parámetros compartidos `video_generate` `images`, `videos` y
    `audioRefs`, con un máximo de 12 archivos de referencia en total.

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

<Tip>
Usa `openclaw models list --provider fal` para ver la lista completa de modelos
fal disponibles, incluidas las entradas agregadas recientemente.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados del agente, incluida la selección de modelos de imagen y video.
  </Card>
</CardGroup>
