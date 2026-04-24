---
read_when:
    - Quieres usar generación de imágenes con fal en OpenClaw
    - Necesitas el flujo de autenticación FAL_KEY
    - Quieres los valores predeterminados de fal para `image_generate` o `video_generate`
summary: Configuración de generación de imágenes y video con fal en OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-24T05:44:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw incluye un proveedor integrado `fal` para generación alojada de imágenes y video.

| Propiedad | Valor                                                         |
| --------- | ------------------------------------------------------------- |
| Proveedor | `fal`                                                         |
| Autenticación | `FAL_KEY` (canónico; `FAL_API_KEY` también funciona como respaldo) |
| API       | endpoints de modelo de fal                                    |

## Primeros pasos

<Steps>
  <Step title="Configura la API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Configura un modelo de imagen predeterminado">
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

| Capacidad     | Valor                      |
| -------------- | -------------------------- |
| Máx. imágenes  | 4 por solicitud            |
| Modo edición   | Habilitado, 1 imagen de referencia |
| Sobrescrituras de tamaño | Compatibles        |
| Relación de aspecto   | Compatible            |
| Resolución     | Compatible                 |

<Warning>
El endpoint de edición de imágenes de fal **no** admite sobrescrituras de `aspectRatio`.
</Warning>

Para usar fal como proveedor predeterminado de imágenes:

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
| Runtime    | Flujo respaldado por cola de envío/estado/resultado para trabajos de larga duración |

<AccordionGroup>
  <Accordion title="Modelos de video disponibles">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

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
Usa `openclaw models list --provider fal` para ver la lista completa de modelos fal disponibles, incluidas las entradas añadidas recientemente.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados del agente, incluida la selección de modelos de imagen y video.
  </Card>
</CardGroup>
