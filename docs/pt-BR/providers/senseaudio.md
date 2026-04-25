---
read_when:
    - Você quer o speech-to-text do SenseAudio para anexos de áudio
    - Você precisa da variável de ambiente da chave de API do SenseAudio ou do caminho de configuração de áudio
summary: SenseAudio em lote para speech-to-text de notas de voz recebidas
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:55:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

O SenseAudio pode transcrever anexos de áudio/notas de voz recebidos por meio do
pipeline compartilhado `tools.media.audio` do OpenClaw. O OpenClaw envia áudio multipart
para o endpoint de transcrição compatível com OpenAI e injeta o texto retornado
como `{{Transcript}}` mais um bloco `[Audio]`.

| Detalhe       | Valor                                            |
| ------------- | ------------------------------------------------ |
| Site          | [senseaudio.cn](https://senseaudio.cn)           |
| Documentação  | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Autenticação  | `SENSEAUDIO_API_KEY`                             |
| Modelo padrão | `senseaudio-asr-pro-1.5-260319`                  |
| URL padrão    | `https://api.senseaudio.cn/v1`                   |

## Primeiros passos

<Steps>
  <Step title="Defina sua chave de API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Habilite o provedor de áudio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envie uma nota de voz">
    Envie uma mensagem de áudio por qualquer canal conectado. O OpenClaw faz upload do
    áudio para o SenseAudio e usa a transcrição no pipeline de resposta.
  </Step>
</Steps>

## Opções

| Opção      | Caminho                               | Descrição                                  |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | id do modelo ASR do SenseAudio             |
| `language` | `tools.media.audio.models[].language` | dica opcional de idioma                    |
| `prompt`   | `tools.media.audio.prompt`            | prompt opcional de transcrição             |
| `baseUrl`  | `tools.media.audio.baseUrl` ou modelo | substitui a base compatível com OpenAI     |
| `headers`  | `tools.media.audio.request.headers`   | cabeçalhos extras da solicitação           |

<Note>
O SenseAudio é somente STT em lote no OpenClaw. A transcrição em tempo real de Voice Call
continua usando provedores com suporte a streaming STT.
</Note>
