---
read_when:
    - Você quer usar text-to-speech do ElevenLabs no OpenClaw
    - Você quer usar speech-to-text Scribe do ElevenLabs para anexos de áudio
    - Você quer transcrição em tempo real do ElevenLabs para Voice Call
summary: Use fala do ElevenLabs, STT Scribe e transcrição em tempo real com OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:54:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

O OpenClaw usa ElevenLabs para text-to-speech, speech-to-text em lote com Scribe
v2 e STT de streaming do Voice Call com Scribe v2 Realtime.

| Capacidade              | Superfície do OpenClaw                        | Padrão                   |
| ----------------------- | --------------------------------------------- | ------------------------ |
| Text-to-speech          | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Speech-to-text em lote  | `tools.media.audio`                           | `scribe_v2`              |
| Speech-to-text em streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`  |

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

Defina `modelId` como `eleven_v3` para usar TTS v3 do ElevenLabs. O OpenClaw mantém
`eleven_multilingual_v2` como padrão para instalações existentes.

## Speech-to-text

Use Scribe v2 para anexos de áudio recebidos e segmentos curtos de voz gravada:

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

O OpenClaw envia áudio multipart para `/v1/speech-to-text` do ElevenLabs com
`model_id: "scribe_v2"`. Dicas de idioma são mapeadas para `language_code` quando presentes.

## STT de streaming para Voice Call

O Plugin integrado `elevenlabs` registra Scribe v2 Realtime para
transcrição em streaming do Voice Call.

| Configuração     | Caminho de configuração                                                     | Padrão                                             |
| ---------------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| Chave de API     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`   | Usa `ELEVENLABS_API_KEY` / `XI_API_KEY` como fallback |
| Modelo           | `...elevenlabs.modelId`                                                     | `scribe_v2_realtime`                               |
| Formato de áudio | `...elevenlabs.audioFormat`                                                 | `ulaw_8000`                                        |
| Sample rate      | `...elevenlabs.sampleRate`                                                  | `8000`                                             |
| Estratégia de commit | `...elevenlabs.commitStrategy`                                           | `vad`                                              |
| Idioma           | `...elevenlabs.languageCode`                                                | (não definido)                                     |

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
O Voice Call recebe mídia do Twilio como G.711 u-law a 8 kHz. O provider
realtime do ElevenLabs usa `ulaw_8000` por padrão, então quadros de telefonia podem ser encaminhados sem
transcodificação.
</Note>

## Relacionados

- [Text-to-speech](/pt-BR/tools/tts)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
