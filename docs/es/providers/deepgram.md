---
read_when:
    - Quieres usar speech-to-text de Deepgram para archivos adjuntos de audio
    - Necesitas un ejemplo rápido de configuración de Deepgram
summary: Transcripción de Deepgram para notas de voz entrantes
title: Deepgram
x-i18n:
    generated_at: "2026-04-12T23:30:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 091523d6669e3d258f07c035ec756bd587299b6c7025520659232b1b2c1e21a5
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Transcripción de audio)

Deepgram es una API de speech-to-text. En OpenClaw se usa para la **transcripción
de audio/notas de voz entrantes** mediante `tools.media.audio`.

Cuando está habilitado, OpenClaw sube el archivo de audio a Deepgram e inyecta la transcripción
en la canalización de respuesta (`{{Transcript}}` + bloque `[Audio]`). Esto **no es streaming**;
usa el endpoint de transcripción pregrabada.

| Detail        | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Sitio web     | [deepgram.com](https://deepgram.com)                       |
| Documentación | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticación | `DEEPGRAM_API_KEY`                                         |
| Modelo predeterminado | `nova-3`                                                   |

## Primeros pasos

<Steps>
  <Step title="Establece tu clave de API">
    Agrega tu clave de API de Deepgram al entorno:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Habilitar el proveedor de audio">
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
  <Step title="Enviar una nota de voz">
    Envía un mensaje de audio a través de cualquier canal conectado. OpenClaw lo transcribe
    mediante Deepgram e inyecta la transcripción en la canalización de respuesta.
  </Step>
</Steps>

## Opciones de configuración

| Option            | Path                                                         | Description                           |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | ID del modelo de Deepgram (predeterminado: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Sugerencia de idioma (opcional)       |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Habilitar detección de idioma (opcional) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Habilitar puntuación (opcional)       |
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

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    La autenticación sigue el orden estándar de autenticación del proveedor. `DEEPGRAM_API_KEY` es
    la ruta más sencilla.
  </Accordion>
  <Accordion title="Proxy y endpoints personalizados">
    Reemplaza endpoints o encabezados con `tools.media.audio.baseUrl` y
    `tools.media.audio.headers` cuando uses un proxy.
  </Accordion>
  <Accordion title="Comportamiento de salida">
    La salida sigue las mismas reglas de audio que otros proveedores (límites de tamaño, tiempos de espera,
    inyección de transcripción).
  </Accordion>
</AccordionGroup>

<Note>
La transcripción de Deepgram es **solo pregrabada** (no streaming en tiempo real). OpenClaw
sube el archivo de audio completo y espera a tener la transcripción completa antes de inyectarla
en la conversación.
</Note>

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
