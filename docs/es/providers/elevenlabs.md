---
read_when:
    - Quieres texto a voz de ElevenLabs en OpenClaw
    - Quieres ElevenLabs Scribe de voz a texto para los archivos adjuntos de audio
    - Quieres transcripción en tiempo real de ElevenLabs para Voice Call o Google Meet
summary: Usa voz de ElevenLabs, Scribe STT y transcripción en tiempo real con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-05T11:40:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw usa ElevenLabs para texto a voz, voz a texto por lotes con Scribe
v2 y STT en streaming con Scribe v2 Realtime. El Plugin está incluido y
habilitado de forma predeterminada; no se necesita ningún paso `plugins install`.

| Capacidad               | Superficie de OpenClaw                                               | Predeterminado          |
| ----------------------- | -------------------------------------------------------------------- | ----------------------- |
| Texto a voz             | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Voz a texto por lotes   | `tools.media.audio`                                                  | `scribe_v2`             |
| Voz a texto en streaming | Streaming de Voice Call o Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`    |

## Autenticación

Define `ELEVENLABS_API_KEY` en el entorno. También se acepta `XI_API_KEY` por
compatibilidad con herramientas existentes de ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Texto a voz

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
`eleven_multilingual_v2` como valor predeterminado para instalaciones existentes.

Los canales de voz de Discord usan el endpoint de TTS en streaming de ElevenLabs cuando ElevenLabs
es el proveedor `voice.tts`/`messages.tts` seleccionado: la reproducción empieza desde el
stream de audio devuelto en lugar de esperar a que OpenClaw descargue primero todo el
archivo de audio. `latencyTier` se asigna al parámetro de consulta
`optimize_streaming_latency` de ElevenLabs para los modelos que lo aceptan; OpenClaw omite ese parámetro para
`eleven_v3`, que lo rechaza.

## Voz a texto

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

OpenClaw envía audio multipart a ElevenLabs `/v1/speech-to-text` con
`model_id: "scribe_v2"`. Las sugerencias de idioma se asignan a `language_code` cuando están presentes.

## STT en streaming

El Plugin `elevenlabs` incluido registra Scribe v2 Realtime para Voice Call y
la transcripción en streaming en modo agente de Google Meet.

| Ajuste              | Ruta de configuración                                                   | Predeterminado                                      |
| ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| Clave de API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Recurre a `ELEVENLABS_API_KEY` / `XI_API_KEY`       |
| Modelo              | `...elevenlabs.modelId`                                                 | `scribe_v2_realtime`                                |
| Formato de audio    | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                         |
| Frecuencia de muestreo | `...elevenlabs.sampleRate`                                           | `8000`                                              |
| Estrategia de confirmación | `...elevenlabs.commitStrategy`                                  | `vad`                                               |
| Idioma              | `...elevenlabs.languageCode`                                            | (sin definir)                                       |

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
Voice Call recibe medios de Twilio como G.711 u-law a 8 kHz. El proveedor realtime
de ElevenLabs usa `ulaw_8000` de forma predeterminada, por lo que las tramas de telefonía se pueden reenviar sin
transcodificación.
</Note>

Para el modo agente de Google Meet, define
`plugins.entries.google-meet.config.realtime.transcriptionProvider` como
`"elevenlabs"` y configura el mismo bloque de proveedor en
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Relacionado

- [Texto a voz](/es/tools/tts)
- [Google Meet](/es/plugins/google-meet)
- [Selección de modelos](/es/concepts/model-providers)
