---
read_when:
    - Você quer o recurso de conversão de fala em texto do SenseAudio para anexos de áudio
    - Você precisa da variável de ambiente da chave de API do SenseAudio ou do caminho de configuração de áudio
summary: Conversão em lote de fala para texto do SenseAudio para notas de voz recebidas
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:11:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio pode transcrever anexos de áudio de entrada e notas de voz pelo pipeline compartilhado `tools.media.audio` do OpenClaw. O OpenClaw publica áudio multipart no endpoint de transcrição compatível com OpenAI e injeta o texto retornado como `{{Transcript}}`, além de um bloco `[Audio]`.

| Propriedade   | Valor                                            |
| ------------- | ------------------------------------------------ |
| ID do provedor | `senseaudio`                                    |
| Plugin        | incluído, `enabledByDefault: true`               |
| Contrato      | `mediaUnderstandingProviders` (áudio)            |
| Var. de ambiente de autenticação | `SENSEAUDIO_API_KEY`            |
| Modelo padrão | `senseaudio-asr-pro-1.5-260319`                  |
| URL padrão    | `https://api.senseaudio.cn/v1`                   |
| Site          | [senseaudio.cn](https://senseaudio.cn)           |
| Documentação  | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Primeiros passos

<Steps>
  <Step title="Defina sua chave de API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Ative o provedor de áudio">
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
    Envie uma mensagem de áudio por qualquer canal conectado. O OpenClaw envia o
    áudio para o SenseAudio e usa a transcrição no pipeline de resposta.
  </Step>
</Steps>

## Opções

| Opção      | Caminho                               | Descrição                           |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID do modelo ASR do SenseAudio      |
| `language` | `tools.media.audio.models[].language` | Dica opcional de idioma             |
| `prompt`   | `tools.media.audio.prompt`            | Prompt opcional de transcrição      |
| `baseUrl`  | `tools.media.audio.baseUrl` ou modelo | Substitui a base compatível com OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Cabeçalhos extras da solicitação    |

<Note>
O SenseAudio é apenas STT em lote no OpenClaw. A transcrição em tempo real de Voice Call
continua usando provedores com suporte a STT por streaming.
</Note>

## Relacionados

- [Entendimento de mídia (áudio)](/pt-BR/nodes/audio)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
