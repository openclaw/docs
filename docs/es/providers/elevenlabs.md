---
read_when:
    - Quieres usar la conversión de texto a voz de ElevenLabs en OpenClaw
    - Quieres usar la transcripción de voz a texto de ElevenLabs Scribe para archivos adjuntos de audio
    - Quieres transcripción en tiempo real de ElevenLabs para llamada de voz o Google Meet
summary: Usa voz de ElevenLabs, Scribe STT y transcripción en tiempo real con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:23:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw usa ElevenLabs para conversión de texto a voz, conversión de voz a texto por lotes con Scribe v2 y STT en streaming con Scribe v2 Realtime.

| Capacidad                         | Superficie de OpenClaw                                                | Predeterminado           |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| Conversión de texto a voz         | `messages.tts` / `talk`                                               | `eleven_multilingual_v2` |
| Conversión de voz a texto por lotes | `tools.media.audio`                                                 | `scribe_v2`              |
| Conversión de voz a texto en streaming | Streaming de Voice Call o `realtime.transcriptionProvider` de Google Meet | `scribe_v2_realtime`     |

## Autenticación

Define `ELEVENLABS_API_KEY` en el entorno. `XI_API_KEY` también se acepta por
compatibilidad con las herramientas existentes de ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Conversión de texto a voz

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Define `modelId` como `eleven_v3` para usar TTS v3 de ElevenLabs. OpenClaw mantiene
`eleven_multilingual_v2` como valor predeterminado para las instalaciones existentes.

Los canales de voz de Discord usan el endpoint de TTS en streaming de ElevenLabs cuando ElevenLabs es
el proveedor `voice.tts`/`messages.tts` seleccionado. La reproducción comienza desde el
flujo de audio devuelto en lugar de esperar a que OpenClaw descargue y escriba primero
todo el archivo de audio. `latencyTier` se asigna al parámetro de consulta
`optimize_streaming_latency` de ElevenLabs para los modelos que lo aceptan; OpenClaw
omite ese parámetro para `eleven_v3`, que lo rechaza.

## Conversión de voz a texto

Usa Scribe v2 para adjuntos de audio entrantes y segmentos cortos de voz grabada:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw envía audio multipart a `/v1/speech-to-text` de ElevenLabs con
`model_id: "scribe_v2"`. Las sugerencias de idioma se asignan a `language_code` cuando están presentes.

## STT en streaming

El Plugin `elevenlabs` incluido registra Scribe v2 Realtime para Voice Call y
transcripción en streaming en modo agente de Google Meet.

| Ajuste              | Ruta de configuración                                                    | Predeterminado                                    |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Clave de API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Recurre a `ELEVENLABS_API_KEY` / `XI_API_KEY`     |
| Modelo              | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Formato de audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Frecuencia de muestreo | `...elevenlabs.sampleRate`                                             | `8000`                                            |
| Estrategia de confirmación | `...elevenlabs.commitStrategy`                                     | `vad`                                             |
| Idioma              | `...elevenlabs.languageCode`                                              | (sin definir)                                     |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
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
Voice Call recibe medios de Twilio como G.711 u-law a 8 kHz. El proveedor en tiempo real
de ElevenLabs usa `ulaw_8000` de forma predeterminada, por lo que los fotogramas de telefonía se pueden reenviar sin
transcodificación.
</Note>

Para el modo agente de Google Meet, define
`plugins.entries.google-meet.config.realtime.transcriptionProvider` como
`"elevenlabs"` y configura el mismo bloque de proveedor en
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Relacionado

- [Conversión de texto a voz](/es/tools/tts)
- [Google Meet](/es/plugins/google-meet)
- [Selección de modelo](/es/concepts/model-providers)
