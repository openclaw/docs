---
read_when:
    - Quieres voz de ElevenLabs en OpenClaw
    - Quieres usar Scribe de ElevenLabs como voz a texto para adjuntos de audio
    - Quieres transcripción en tiempo real de ElevenLabs para Voice Call with OpenClaw
summary: Usa voz de ElevenLabs, Scribe STT y transcripción en tiempo real con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T05:19:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw usa ElevenLabs para texto a voz, voz a texto por lotes con Scribe
v2 y STT en streaming de Voice Call con Scribe v2 Realtime.

| Capability               | OpenClaw surface                              | Default                  |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Texto a voz              | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Voz a texto por lotes    | `tools.media.audio`                           | `scribe_v2`              |
| Voz a texto en streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Autenticación

Establece `ELEVENLABS_API_KEY` en el entorno. `XI_API_KEY` también se acepta por
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

## STT en streaming de Voice Call

El Plugin incluido `elevenlabs` registra Scribe v2 Realtime para la
transcripción en streaming de Voice Call.

| Setting         | Config path                                                               | Default                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Clave API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Usa `ELEVENLABS_API_KEY` / `XI_API_KEY` como respaldo |
| Modelo          | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Formato de audio | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                       |
| Frecuencia de muestreo | `...elevenlabs.sampleRate`                                         | `8000`                                            |
| Estrategia de confirmación | `...elevenlabs.commitStrategy`                                   | `vad`                                             |
| Idioma          | `...elevenlabs.languageCode`                                              | (sin establecer)                                  |

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
Voice Call recibe multimedia de Twilio como G.711 u-law de 8 kHz. El proveedor en tiempo real de ElevenLabs
usa `ulaw_8000` de forma predeterminada, por lo que los frames de telefonía pueden reenviarse sin
transcodificación.
</Note>
