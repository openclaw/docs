---
read_when:
    - Você quer usar text-to-speech do ElevenLabs no OpenClaw
    - Você quer usar speech-to-text do ElevenLabs Scribe para anexos de áudio
    - Você quer transcrição em tempo real do ElevenLabs para Voice Call
summary: Use fala do ElevenLabs, Scribe STT e transcrição em tempo real com o OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T06:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

O OpenClaw usa ElevenLabs para text-to-speech, speech-to-text em lote com Scribe
v2 e STT de streaming para Voice Call com Scribe v2 Realtime.

| Capacidade               | Superfície do OpenClaw                         | Padrão                  |
| ------------------------ | --------------------------------------------- | ----------------------- |
| Text-to-speech           | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Speech-to-text em lote   | `tools.media.audio`                           | `scribe_v2`             |
| Speech-to-text em streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`    |

## Autenticação

Defina `ELEVENLABS_API_KEY` no ambiente. `XI_API_KEY` também é aceito por
compatibilidade com ferramentas existentes do ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-speech

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

## Speech-to-text

Use Scribe v2 para anexos de áudio de entrada e segmentos curtos de voz gravada:

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

O OpenClaw envia áudio multipart para o endpoint do ElevenLabs `/v1/speech-to-text` com
`model_id: "scribe_v2"`. Dicas de idioma são mapeadas para `language_code` quando presentes.

## STT de streaming para Voice Call

O Plugin empacotado `elevenlabs` registra Scribe v2 Realtime para transcrição
de streaming do Voice Call.

| Configuração    | Caminho de configuração                                                     | Padrão                                           |
| --------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| Chave de API    | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`   | Usa fallback para `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modelo          | `...elevenlabs.modelId`                                                     | `scribe_v2_realtime`                             |
| Formato de áudio | `...elevenlabs.audioFormat`                                                | `ulaw_8000`                                      |
| Taxa de amostragem | `...elevenlabs.sampleRate`                                               | `8000`                                           |
| Estratégia de commit | `...elevenlabs.commitStrategy`                                         | `vad`                                            |
| Idioma          | `...elevenlabs.languageCode`                                                | (não definido)                                   |

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
O Voice Call recebe mídia do Twilio como G.711 u-law de 8 kHz. O provedor realtime do ElevenLabs
usa `ulaw_8000` por padrão, então frames de telefonia podem ser encaminhados sem
transcodificação.
</Note>

## Relacionados

- [Text-to-speech](/pt-BR/tools/tts)
- [Model selection](/pt-BR/concepts/model-providers)
