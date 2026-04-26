---
read_when:
    - Quieres usar la generación de imágenes de fal en OpenClaw
    - Necesitas el flujo de autenticación de `FAL_KEY`
    - Quieres los valores predeterminados de fal para `image_generate` o `video_generate`
summary: Configuración de generación de imágenes y vídeo de fal en OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:36:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw incluye un proveedor `fal` integrado para la generación alojada de imágenes y video.

| Propiedad | Valor                                                         |
| --------- | ------------------------------------------------------------- |
| Proveedor | `fal`                                                         |
| Autenticación | `FAL_KEY` (canónico; `FAL_API_KEY` también funciona como alternativa) |
| API       | endpoints de modelos de fal                                   |

## Primeros pasos

<Steps>
  <Step title="Configura la clave de API">
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

| Capacidad         | Valor                      |
| ----------------- | -------------------------- |
| Máximo de imágenes | 4 por solicitud            |
| Modo de edición   | Activado, 1 imagen de referencia |
| Reemplazos de tamaño | Compatibles             |
| Relación de aspecto | Compatible               |
| Resolución        | Compatible                 |
| Formato de salida | `png` o `jpeg`             |

<Warning>
El endpoint de edición de imágenes de fal **no** admite reemplazos de `aspectRatio`.
</Warning>

Usa `outputFormat: "png"` cuando quieras salida PNG. fal no declara un
control explícito de fondo transparente en OpenClaw, por lo que `background:
"transparent"` se informa como un reemplazo ignorado para los modelos fal.

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

| Capacidad | Valor                                                              |
| --------- | ------------------------------------------------------------------ |
| Modos     | Texto a video, referencia de una sola imagen, referencia a video de Seedance |
| Ejecución | Flujo de envío/estado/resultado respaldado por cola para trabajos de larga duración |

<AccordionGroup>
  <Accordion title="Modelos de video disponibles">
    **Agente de video de HeyGen:**

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

    La referencia a video acepta hasta 9 imágenes, 3 videos y 3 referencias de audio
    mediante los parámetros compartidos `images`, `videos` y `audioRefs` de `video_generate`,
    con un máximo de 12 archivos de referencia en total.

  </Accordion>

  <Accordion title="Ejemplo de configuración del agente de video de HeyGen">
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
Usa `openclaw models list --provider fal` para ver la lista completa de modelos fal
disponibles, incluidas las entradas agregadas recientemente.
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
