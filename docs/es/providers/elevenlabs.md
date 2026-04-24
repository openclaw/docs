---
read_when:
    - Quieres usar texto a voz de ElevenLabs en OpenClaw
    - Quieres usar STT de ElevenLabs Scribe para adjuntos de audio
    - Quieres usar transcripción en tiempo real de ElevenLabs para Voice Call
summary: Usar voz de ElevenLabs, STT de Scribe y transcripción en tiempo real con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T05:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw usa ElevenLabs para texto a voz, voz a texto por lotes con Scribe
v2 y STT en streaming de Voice Call con Scribe v2 Realtime.

| Capacidad               | Superficie de OpenClaw                         | Predeterminado            |
| ----------------------- | --------------------------------------------- | ------------------------- |
| Texto a voz             | `messages.tts` / `talk`                       | `eleven_multilingual_v2`  |
| Voz a texto por lotes   | `tools.media.audio`                           | `scribe_v2`               |
| Voz a texto en streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`      |

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

OpenClaw envía audio multipart a `/v1/speech-to-text` de ElevenLabs con
`model_id: "scribe_v2"`. Las sugerencias de idioma se asignan a `language_code` cuando están presentes.

## STT en streaming de Voice Call

El Plugin incluido `elevenlabs` registra Scribe v2 Realtime para la
transcripción en streaming de Voice Call.

| Ajuste            | Ruta de configuración                                                      | Predeterminado                                     |
| ----------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| Clave API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Recurre a `ELEVENLABS_API_KEY` / `XI_API_KEY`      |
| Modelo            | `...elevenlabs.modelId`                                                    | `scribe_v2_realtime`                               |
| Formato de audio  | `...elevenlabs.audioFormat`                                                | `ulaw_8000`                                        |
| Frecuencia de muestreo | `...elevenlabs.sampleRate`                                           | `8000`                                             |
| Estrategia de commit | `...elevenlabs.commitStrategy`                                         | `vad`                                              |
| Idioma            | `...elevenlabs.languageCode`                                               | (sin configurar)                                   |

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
Voice Call recibe medios de Twilio como G.711 u-law de 8 kHz. El proveedor en tiempo real de ElevenLabs
usa `ulaw_8000` de forma predeterminada, por lo que los frames de telefonía pueden reenviarse sin
transcodificación.
</Note>

## Relacionado

- [Texto a voz](/es/tools/tts)
- [Selección de modelos](/es/concepts/model-providers)
