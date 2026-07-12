---
read_when:
    - Você quer usar a conversão de texto em fala da ElevenLabs no OpenClaw
    - Você quer usar o recurso de conversão de fala em texto do ElevenLabs Scribe para anexos de áudio
    - Você quer a transcrição em tempo real da ElevenLabs para chamadas de voz ou Google Meet
summary: Use a fala do ElevenLabs, o Scribe STT e a transcrição em tempo real com o OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T15:32:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

O OpenClaw usa a ElevenLabs para conversão de texto em fala, conversão de fala em texto em lote com o Scribe
v2 e STT por streaming com o Scribe v2 Realtime. O plugin vem incluído e
habilitado por padrão; nenhuma etapa de `plugins install` é necessária.

| Recurso                       | Superfície do OpenClaw                                                | Padrão                   |
| ----------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Conversão de texto em fala    | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Conversão de fala em texto em lote | `tools.media.audio`                                              | `scribe_v2`              |
| Conversão de fala em texto por streaming | Streaming do Voice Call ou `realtime.transcriptionProvider` do Google Meet | `scribe_v2_realtime`     |

## Autenticação

Defina `ELEVENLABS_API_KEY` no ambiente. `XI_API_KEY` também é aceita para
compatibilidade com as ferramentas existentes da ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Conversão de texto em fala

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

Defina `modelId` como `eleven_v3` para usar o TTS v3 da ElevenLabs. O OpenClaw mantém
`eleven_multilingual_v2` como padrão para instalações existentes.

Os canais de voz do Discord usam o endpoint de TTS por streaming da ElevenLabs quando ela
é o provedor `voice.tts`/`messages.tts` selecionado: a reprodução começa a partir do
stream de áudio retornado, em vez de aguardar o OpenClaw baixar primeiro o arquivo
de áudio inteiro. `latencyTier` corresponde ao parâmetro de consulta `optimize_streaming_latency`
da ElevenLabs para os modelos que o aceitam; o OpenClaw omite esse parâmetro para
`eleven_v3`, que o rejeita.

## Conversão de fala em texto

Use o Scribe v2 para anexos de áudio recebidos e segmentos curtos de voz gravados:

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
`model_id: "scribe_v2"`. Quando presentes, as indicações de idioma correspondem a `language_code`.

## STT por streaming

O plugin `elevenlabs` incluído registra o Scribe v2 Realtime para transcrição por streaming
do Voice Call e do modo de agente do Google Meet.

| Configuração             | Caminho de configuração                                                    | Padrão                                            |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------- |
| Chave de API             | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`  | Usa `ELEVENLABS_API_KEY` / `XI_API_KEY` como alternativa |
| Modelo                   | `...elevenlabs.modelId`                                                    | `scribe_v2_realtime`                              |
| Formato de áudio         | `...elevenlabs.audioFormat`                                                | `ulaw_8000`                                       |
| Taxa de amostragem       | `...elevenlabs.sampleRate`                                                 | `8000`                                            |
| Estratégia de confirmação | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Idioma                   | `...elevenlabs.languageCode`                                               | (não definido)                                    |

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
O Voice Call recebe mídia do Twilio como G.711 u-law de 8 kHz. O provedor em tempo real
da ElevenLabs usa `ulaw_8000` por padrão, portanto os quadros de telefonia podem ser encaminhados sem
transcodificação.
</Note>

Para o modo de agente do Google Meet, defina
`plugins.entries.google-meet.config.realtime.transcriptionProvider` como
`"elevenlabs"` e configure o mesmo bloco do provedor em
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Relacionados

- [Conversão de texto em fala](/pt-BR/tools/tts)
- [Google Meet](/pt-BR/plugins/google-meet)
- [Seleção de modelos](/pt-BR/concepts/model-providers)
