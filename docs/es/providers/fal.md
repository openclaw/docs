---
read_when:
    - Quieres usar la generación de imágenes de fal en OpenClaw
    - Necesitas el flujo de autenticación `FAL_KEY`
    - Quieres valores predeterminados de fal para `image_generate` o `video_generate`
summary: Configuración de generación de imágenes y video de fal en OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-12T23:30:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff275233179b4808d625383efe04189ad9e92af09944ba39f1e953e77378e347
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw incluye un proveedor `fal` integrado para la generación alojada de imágenes y video.

| Propiedad | Valor                                                         |
| --------- | ------------------------------------------------------------- |
| Proveedor | `fal`                                                         |
| Autenticación | `FAL_KEY` (canónico; `FAL_API_KEY` también funciona como alternativa) |
| API       | endpoints de modelos de fal                                   |

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

El proveedor integrado de generación de imágenes `fal` usa por defecto
`fal/fal-ai/flux/dev`.

| Capacidad       | Valor                      |
| ---------------- | -------------------------- |
| Máximo de imágenes | 4 por solicitud            |
| Modo de edición   | Habilitado, 1 imagen de referencia |
| Sustituciones de tamaño | Compatible                  |
| Relación de aspecto | Compatible                  |
| Resolución       | Compatible                  |

<Warning>
El endpoint de edición de imágenes de fal **no** admite sustituciones de `aspectRatio`.
</Warning>

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

El proveedor integrado de generación de video `fal` usa por defecto
`fal/fal-ai/minimax/video-01-live`.

| Capacidad | Valor                                                        |
| ---------- | ------------------------------------------------------------ |
| Modos      | Texto a video, referencia de imagen única                    |
| Runtime    | Flujo de envío/estado/resultado respaldado por cola para trabajos de larga duración |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

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

<Tip>
Usa `openclaw models list --provider fal` para ver la lista completa de modelos fal disponibles, incluidas las entradas agregadas recientemente.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Image generation" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference#agent-defaults" icon="gear">
    Valores predeterminados del agente, incluida la selección de modelos de imagen y video.
  </Card>
</CardGroup>
