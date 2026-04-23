---
read_when:
    - Quiere conversión de voz a texto de Deepgram para adjuntos de audio
    - Quiere transcripción en streaming de Deepgram para Voice Call
    - Necesita un ejemplo rápido de configuración de Deepgram
summary: Transcripción de notas de voz entrantes con Deepgram
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T05:19:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddc55436ebae295db9bd979765fbccab3ba7f25a6f5354a4e7964d151faffa22
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Transcripción de audio)

Deepgram es una API de voz a texto. En OpenClaw se usa para la
transcripción de audio/notas de voz entrantes mediante `tools.media.audio` y para STT
en streaming de Voice Call mediante `plugins.entries.voice-call.config.streaming`.

Para la transcripción por lotes, OpenClaw carga el archivo de audio completo a Deepgram
e inyecta la transcripción en la canalización de respuesta (`{{Transcript}}` +
bloque `[Audio]`). Para el streaming de Voice Call, OpenClaw reenvía tramas G.711
u-law en vivo por el extremo WebSocket `listen` de Deepgram y emite transcripciones parciales o
finales a medida que Deepgram las devuelve.

| Detail        | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Sitio web       | [deepgram.com](https://deepgram.com)                       |
| Documentación          | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticación          | `DEEPGRAM_API_KEY`                                         |
| Modelo predeterminado | `nova-3`                                                   |

## Primeros pasos

<Steps>
  <Step title="Establezca su clave de API">
    Agregue su clave de API de Deepgram al entorno:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Habilite el proveedor de audio">
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
  <Step title="Envíe una nota de voz">
    Envíe un mensaje de audio por cualquier canal conectado. OpenClaw lo transcribe
    mediante Deepgram e inyecta la transcripción en la canalización de respuesta.
  </Step>
</Steps>

## Opciones de configuración

| Option            | Path                                                         | Description                           |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | ID del modelo de Deepgram (predeterminado: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Pista de idioma (opcional)              |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Habilita la detección de idioma (opcional)  |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Habilita la puntuación (opcional)         |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Habilita el formato inteligente (opcional)    |

<Tabs>
  <Tab title="Con pista de idioma">
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

El plugin incluido `deepgram` también registra un proveedor de transcripción en tiempo real
para el plugin Voice Call.

| Setting         | Config path                                                             | Default                          |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| Clave de API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Recurre a `DEEPGRAM_API_KEY` |
| Modelo           | `...deepgram.model`                                                     | `nova-3`                         |
| Idioma        | `...deepgram.language`                                                  | (sin establecer)                          |
| Codificación        | `...deepgram.encoding`                                                  | `mulaw`                          |
| Frecuencia de muestreo     | `...deepgram.sampleRate`                                                | `8000`                           |
| Delimitación de extremos     | `...deepgram.endpointingMs`                                             | `800`                            |
| Resultados intermedios | `...deepgram.interimResults`                                            | `true`                           |

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
    La autenticación sigue el orden estándar de autenticación del proveedor. `DEEPGRAM_API_KEY` es
    la vía más sencilla.
  </Accordion>
  <Accordion title="Proxy y extremos personalizados">
    Anule extremos o encabezados con `tools.media.audio.baseUrl` y
    `tools.media.audio.headers` cuando use un proxy.
  </Accordion>
  <Accordion title="Comportamiento de salida">
    La salida sigue las mismas reglas de audio que otros proveedores (límites de tamaño, tiempos de espera,
    inyección de transcripción).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Herramientas multimedia" href="/tools/media" icon="photo-film">
    Descripción general de la canalización de procesamiento de audio, imagen y video.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración, incluida la configuración de herramientas multimedia.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
  <Card title="Preguntas frecuentes" href="/es/help/faq" icon="circle-question">
    Preguntas frecuentes sobre la configuración de OpenClaw.
  </Card>
</CardGroup>
