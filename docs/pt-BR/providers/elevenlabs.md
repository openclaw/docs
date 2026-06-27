---
read_when:
    - Você quer conversão de texto em fala da ElevenLabs no OpenClaw
    - Você quer o speech-to-text ElevenLabs Scribe para anexos de áudio
    - Você quer transcrição em tempo real do ElevenLabs para Voice Call ou Google Meet
summary: Use fala da ElevenLabs, Scribe STT e transcrição em tempo real com OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T18:03:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

O OpenClaw usa ElevenLabs para texto para fala, fala para texto em lote com Scribe
v2 e STT por streaming com Scribe v2 Realtime.

| Recurso                         | Superfície do OpenClaw                                                | Padrão                   |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| Texto para fala                 | `messages.tts` / `talk`                                               | `eleven_multilingual_v2` |
| Fala para texto em lote         | `tools.media.audio`                                                   | `scribe_v2`              |
| Fala para texto por streaming   | Streaming de chamada de voz ou Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Autenticação

Defina `ELEVENLABS_API_KEY` no ambiente. `XI_API_KEY` também é aceito para
compatibilidade com ferramentas existentes da ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Texto para fala

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Defina `modelId` como `eleven_v3` para usar o TTS v3 da ElevenLabs. O OpenClaw mantém
`eleven_multilingual_v2` como o padrão para instalações existentes.

Canais de voz do Discord usam o endpoint de TTS por streaming da ElevenLabs quando a ElevenLabs é
a provedora `voice.tts`/`messages.tts` selecionada. A reprodução começa a partir do
stream de áudio retornado, em vez de esperar que o OpenClaw baixe e grave primeiro o
arquivo de áudio inteiro. `latencyTier` é mapeado para o parâmetro de consulta
`optimize_streaming_latency` da ElevenLabs nos modelos que o aceitam; o OpenClaw
omite esse parâmetro para `eleven_v3`, que o rejeita.

## Fala para texto

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

O OpenClaw envia áudio multipart para `/v1/speech-to-text` da ElevenLabs com
`model_id: "scribe_v2"`. Dicas de idioma são mapeadas para `language_code` quando presentes.

## STT por streaming

O Plugin `elevenlabs` incluído registra Scribe v2 Realtime para transcrição por streaming
em modo de agente em chamada de voz e Google Meet.

| Configuração       | Caminho de configuração                                                  | Padrão                                            |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Chave de API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Recorre a `ELEVENLABS_API_KEY` / `XI_API_KEY`     |
| Modelo             | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Formato de áudio   | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Taxa de amostragem | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Estratégia de commit | `...elevenlabs.commitStrategy`                                          | `vad`                                             |
| Idioma             | `...elevenlabs.languageCode`                                              | (não definido)                                    |

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
A chamada de voz recebe mídia do Twilio como G.711 u-law de 8 kHz. A provedora realtime da ElevenLabs
usa `ulaw_8000` por padrão, então quadros de telefonia podem ser encaminhados sem
transcodificação.
</Note>

Para o modo de agente do Google Meet, defina
`plugins.entries.google-meet.config.realtime.transcriptionProvider` como
`"elevenlabs"` e configure o mesmo bloco de provedora em
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Relacionado

- [Texto para fala](/pt-BR/tools/tts)
- [Google Meet](/pt-BR/plugins/google-meet)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
