---
read_when:
    - Quieres speech-to-text de Deepgram para adjuntos de audio
    - Quieres transcripción en streaming de Deepgram para Voice Call
    - Necesitas un ejemplo rápido de configuración de Deepgram
summary: Transcripción de Deepgram para notas de voz entrantes
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T14:06:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Transcripción de audio)

Deepgram es una API de speech-to-text. En OpenClaw se usa para la
transcripción de audio/notas de voz entrantes mediante `tools.media.audio` y para STT
en streaming de Voice Call mediante `plugins.entries.voice-call.config.streaming`.

Para la transcripción por lotes, OpenClaw sube el archivo de audio completo a Deepgram
e inyecta la transcripción en la canalización de respuesta (`{{Transcript}}` +
bloque `[Audio]`). Para el streaming de Voice Call, OpenClaw reenvía tramas
G.711 u-law en vivo mediante el endpoint WebSocket `listen` de Deepgram y emite
transcripciones parciales o finales según las devuelve Deepgram.

| Detalle       | Valor                                                      |
| ------------- | ---------------------------------------------------------- |
| Sitio web     | [deepgram.com](https://deepgram.com)                       |
| Documentación | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticación | `DEEPGRAM_API_KEY`                                         |
| Modelo predeterminado | `nova-3`                                           |

## Primeros pasos

<Steps>
  <Step title="Establece tu clave API">
    Añade tu clave API de Deepgram al entorno:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Habilita el proveedor de audio">
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
  <Step title="Envía una nota de voz">
    Envía un mensaje de audio a través de cualquier canal conectado. OpenClaw lo transcribe
    mediante Deepgram e inyecta la transcripción en la canalización de respuesta.
  </Step>
</Steps>

## Opciones de configuración

| Opción            | Ruta                                                         | Descripción                              |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | ID de modelo de Deepgram (predeterminado: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Sugerencia de idioma (opcional)          |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Habilitar detección de idioma (opcional) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Habilitar puntuación (opcional)          |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Habilitar formato inteligente (opcional) |

<Tabs>
  <Tab title="Con sugerencia de idioma">
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
  <Tab title="Con opciones de Deepgram">
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

El Plugin incluido `deepgram` también registra un proveedor de transcripción en tiempo real
para el Plugin Voice Call.

| Ajuste          | Ruta de configuración                                                   | Predeterminado                    |
| --------------- | ----------------------------------------------------------------------- | --------------------------------- |
| Clave API       | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Recurre a `DEEPGRAM_API_KEY`      |
| Modelo          | `...deepgram.model`                                                     | `nova-3`                          |
| Idioma          | `...deepgram.language`                                                  | (sin establecer)                  |
| Codificación    | `...deepgram.encoding`                                                  | `mulaw`                           |
| Frecuencia de muestreo | `...deepgram.sampleRate`                                         | `8000`                            |
| Detección de final de frase | `...deepgram.endpointingMs`                                 | `800`                             |
| Resultados provisionales | `...deepgram.interimResults`                                    | `true`                            |

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
Voice Call recibe audio de telefonía como G.711 u-law a 8 kHz. El proveedor
de streaming de Deepgram usa por defecto `encoding: "mulaw"` y `sampleRate: 8000`, por lo que
las tramas multimedia de Twilio pueden reenviarse directamente.
</Note>

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    La autenticación sigue el orden estándar de autenticación de proveedores. `DEEPGRAM_API_KEY` es
    la vía más sencilla.
  </Accordion>
  <Accordion title="Proxy y endpoints personalizados">
    Anula endpoints o encabezados con `tools.media.audio.baseUrl` y
    `tools.media.audio.headers` cuando uses un proxy.
  </Accordion>
  <Accordion title="Comportamiento de salida">
    La salida sigue las mismas reglas de audio que otros proveedores (límites de tamaño, tiempos de espera,
    inyección de transcripción).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Herramientas multimedia" href="/es/tools/media-overview" icon="photo-film">
    Descripción general de la canalización de procesamiento de audio, imagen y vídeo.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración, incluidos los ajustes de la herramienta multimedia.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
  <Card title="FAQ" href="/es/help/faq" icon="circle-question">
    Preguntas frecuentes sobre la configuración de OpenClaw.
  </Card>
</CardGroup>
