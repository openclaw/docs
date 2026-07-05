---
read_when:
    - Quieres conversión de voz a texto de Deepgram para adjuntos de audio
    - Quieres transcripción en streaming de Deepgram para llamadas de voz
    - Necesitas un ejemplo rápido de configuración de Deepgram
summary: Transcripción de Deepgram para notas de voz entrantes
title: Deepgram
x-i18n:
    generated_at: "2026-07-05T11:35:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram es una API de voz a texto. OpenClaw la usa para la transcripción de audio/notas de voz entrantes
mediante `tools.media.audio` y para STT en streaming de Voice Call
mediante `plugins.entries.voice-call.config.streaming`.

La transcripción por lotes sube el archivo de audio completo a Deepgram e inyecta
la transcripción en la canalización de respuesta (bloque `{{Transcript}}` + `[Audio]`).
El streaming de Voice Call reenvía tramas G.711 u-law en vivo por el endpoint
`listen` de WebSocket de Deepgram y emite transcripciones parciales/finales a medida que Deepgram
las devuelve.

| Detalle       | Valor                                                      |
| ------------- | ---------------------------------------------------------- |
| Sitio web     | [deepgram.com](https://deepgram.com)                       |
| Documentación | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticación | `DEEPGRAM_API_KEY`                                         |
| Modelo predeterminado | `nova-3`                                            |

## Primeros pasos

<Steps>
  <Step title="Set your API key">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Enable the audio provider">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a voice note">
    Envía un mensaje de audio a través de cualquier canal conectado. OpenClaw lo transcribe
    mediante Deepgram e inyecta la transcripción en la canalización de respuesta.
  </Step>
</Steps>

## Opciones de configuración

| Opción     | Ruta                                  | Descripción                                      |
| ---------- | ------------------------------------- | ------------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | Id. de modelo de Deepgram (predeterminado: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Pista de idioma (opcional)                       |

`providerOptions.deepgram` combina parámetros de consulta adicionales directamente en la
solicitud `/listen` de Deepgram, por lo que funciona cualquier nombre de parámetro compatible con Deepgram
(por ejemplo, `detect_language`, `punctuate`, `smart_format`):

<Tabs>
  <Tab title="With language hint">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="With Deepgram options">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## STT en streaming de Voice Call

El plugin `deepgram` incluido también registra un proveedor de transcripción en tiempo real
para el plugin Voice Call.

| Ajuste              | Ruta de configuración                                                 | Predeterminado                         |
| ------------------- | --------------------------------------------------------------------- | -------------------------------------- |
| Clave de API        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Recurre a `DEEPGRAM_API_KEY`           |
| Modelo              | `...deepgram.model`                                                   | `nova-3`                               |
| Idioma              | `...deepgram.language`                                                | (sin definir)                          |
| Codificación        | `...deepgram.encoding`                                                | `mulaw`                                |
| Frecuencia de muestreo | `...deepgram.sampleRate`                                           | `8000`                                 |
| Endpointing         | `...deepgram.endpointingMs`                                           | `800`                                  |
| Resultados provisionales | `...deepgram.interimResults`                                    | `true`                                 |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call recibe audio telefónico como G.711 u-law a 8 kHz. El proveedor de
streaming de Deepgram usa de forma predeterminada `encoding: "mulaw"` y `sampleRate: 8000`, por lo que
las tramas multimedia de Twilio se pueden reenviar directamente.
</Note>

## Notas

<AccordionGroup>
  <Accordion title="Authentication">
    La autenticación sigue el orden estándar de autenticación del proveedor. `DEEPGRAM_API_KEY` es
    la ruta más sencilla.
  </Accordion>
  <Accordion title="Proxy and custom endpoints">
    Sobrescribe endpoints o encabezados con `tools.media.audio.baseUrl` y
    `tools.media.audio.headers` al usar un proxy.
  </Accordion>
  <Accordion title="Output behavior">
    La salida sigue las mismas reglas de audio que otros proveedores (límites de tamaño, tiempos de espera,
    inyección de transcripciones).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Media tools" href="/es/tools/media-overview" icon="photo-film">
    Resumen de la canalización de procesamiento de audio, imágenes y video.
  </Card>
  <Card title="Configuration" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración, incluidos los ajustes de herramientas multimedia.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
  <Card title="FAQ" href="/es/help/faq" icon="circle-question">
    Preguntas frecuentes sobre la configuración de OpenClaw.
  </Card>
</CardGroup>
