---
read_when:
    - Você quer conversão de texto em fala da ElevenLabs no OpenClaw
    - Você quer usar o ElevenLabs Scribe para transcrição de fala em texto em anexos de áudio
    - Você quer transcrição em tempo real da ElevenLabs para Chamada de voz ou Google Meet
summary: Use a fala da ElevenLabs, o Scribe STT e a transcrição em tempo real com o OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:23:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw usa ElevenLabs para texto para fala, fala para texto em lote com Scribe
v2 e STT por streaming com Scribe v2 Realtime.

| Recurso                  | Superfície do OpenClaw                                                | Padrão                   |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Texto para fala          | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Fala para texto em lote  | `tools.media.audio`                                                  | `scribe_v2`              |
| Fala para texto por streaming | streaming de Chamada de voz ou Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

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
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Defina `modelId` como `eleven_v3` para usar o TTS v3 da ElevenLabs. OpenClaw mantém
`eleven_multilingual_v2` como padrão para instalações existentes.

Os canais de voz do Discord usam o endpoint de TTS por streaming da ElevenLabs quando a ElevenLabs é
o provedor `voice.tts`/`messages.tts` selecionado. A reprodução começa a partir do
stream de áudio retornado, em vez de esperar o OpenClaw baixar e gravar
todo o arquivo de áudio primeiro. `latencyTier` é mapeado para o parâmetro de consulta
`optimize_streaming_latency` da ElevenLabs para modelos que o aceitam; o OpenClaw
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

OpenClaw envia áudio multipart para `/v1/speech-to-text` da ElevenLabs com
`model_id: "scribe_v2"`. Dicas de idioma são mapeadas para `language_code` quando presentes.

## STT por streaming

O Plugin `elevenlabs` incluído registra Scribe v2 Realtime para transcrição por streaming da Chamada de voz e do modo de agente do Google Meet.

| Configuração       | Caminho de configuração                                                  | Padrão                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Chave de API    | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Recorre a `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modelo          | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Formato de áudio | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Taxa de amostragem | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Estratégia de commit | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Idioma          | `...elevenlabs.languageCode`                                              | (não definido)                                           |

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
A Chamada de voz recebe mídia do Twilio como G.711 u-law de 8 kHz. O provedor realtime
da ElevenLabs usa `ulaw_8000` por padrão, portanto os quadros de telefonia podem ser encaminhados sem
transcodificação.
</Note>

Para o modo de agente do Google Meet, defina
`plugins.entries.google-meet.config.realtime.transcriptionProvider` como
`"elevenlabs"` e configure o mesmo bloco de provedor em
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Relacionados

- [Texto para fala](/pt-BR/tools/tts)
- [Google Meet](/pt-BR/plugins/google-meet)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
