---
read_when:
    - Quieres usar la conversión de voz a texto de Deepgram para archivos de audio adjuntos
    - Quieres la transcripción en streaming de Deepgram para llamadas de voz
    - Necesitas un ejemplo rápido de configuración de Deepgram
summary: Transcripción de Deepgram para notas de voz entrantes
title: Deepgram
x-i18n:
    generated_at: "2026-07-11T23:25:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram es una API de conversión de voz a texto. OpenClaw la utiliza para transcribir audio y notas de voz entrantes mediante `tools.media.audio`, y para la conversión de voz a texto en streaming de Voice Call mediante `plugins.entries.voice-call.config.streaming`.

La transcripción por lotes carga el archivo de audio completo en Deepgram e inserta la transcripción en el flujo de respuestas (el bloque `{{Transcript}}` + `[Audio]`). El streaming de Voice Call reenvía en tiempo real tramas G.711 u-law mediante el endpoint WebSocket `listen` de Deepgram y emite transcripciones parciales y finales a medida que Deepgram las devuelve.

| Detalle            | Valor                                                      |
| ------------------ | ---------------------------------------------------------- |
| Sitio web          | [deepgram.com](https://deepgram.com)                       |
| Documentación      | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticación      | `DEEPGRAM_API_KEY`                                         |
| Modelo predeterminado | `nova-3`                                                |

## Primeros pasos

<Steps>
  <Step title="Configura tu clave de API">
    ```bash
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
    Envía un mensaje de audio mediante cualquier canal conectado. OpenClaw lo transcribe
    mediante Deepgram e inserta la transcripción en el flujo de respuestas.
  </Step>
</Steps>

## Opciones de configuración

| Opción     | Ruta                                  | Descripción                                      |
| ---------- | ------------------------------------- | ------------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | Id. del modelo de Deepgram (predeterminado: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Indicación de idioma (opcional)                  |

`providerOptions.deepgram` combina parámetros de consulta adicionales directamente con la solicitud `/listen` de Deepgram, por lo que se admite cualquier nombre de parámetro compatible con Deepgram (por ejemplo, `detect_language`, `punctuate` y `smart_format`):

<Tabs>
  <Tab title="Con indicación de idioma">
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

## Conversión de voz a texto en streaming de Voice Call

El Plugin `deepgram` incluido también registra un proveedor de transcripción en tiempo real para el Plugin Voice Call.

| Ajuste               | Ruta de configuración                                                    | Valor predeterminado                 |
| -------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| Clave de API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey`  | Recurre a `DEEPGRAM_API_KEY`         |
| Modelo               | `...deepgram.model`                                                      | `nova-3`                             |
| Idioma               | `...deepgram.language`                                                   | (sin configurar)                     |
| Codificación         | `...deepgram.encoding`                                                   | `mulaw`                              |
| Frecuencia de muestreo | `...deepgram.sampleRate`                                               | `8000`                               |
| Detección de fin     | `...deepgram.endpointingMs`                                              | `800`                                |
| Resultados provisionales | `...deepgram.interimResults`                                         | `true`                               |

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
Voice Call recibe audio telefónico como G.711 u-law a 8 kHz. El proveedor de streaming de Deepgram usa de forma predeterminada `encoding: "mulaw"` y `sampleRate: 8000`, por lo que las tramas multimedia de Twilio pueden reenviarse directamente.
</Note>

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    La autenticación sigue el orden estándar de autenticación de proveedores. `DEEPGRAM_API_KEY` es la opción más sencilla.
  </Accordion>
  <Accordion title="Proxy y endpoints personalizados">
    Sobrescribe los endpoints o encabezados con `tools.media.audio.baseUrl` y
    `tools.media.audio.headers` cuando utilices un proxy.
  </Accordion>
  <Accordion title="Comportamiento de la salida">
    La salida sigue las mismas reglas de audio que los demás proveedores (límites de tamaño, tiempos de espera e inserción de transcripciones).
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Herramientas multimedia" href="/es/tools/media-overview" icon="photo-film">
    Descripción general del flujo de procesamiento de audio, imágenes y vídeo.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración, incluidos los ajustes de las herramientas multimedia.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas habituales y pasos de depuración.
  </Card>
  <Card title="Preguntas frecuentes" href="/es/help/faq" icon="circle-question">
    Preguntas frecuentes sobre la configuración de OpenClaw.
  </Card>
</CardGroup>
