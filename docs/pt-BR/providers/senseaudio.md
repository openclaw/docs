---
read_when:
    - Você quer usar a conversão de fala em texto do SenseAudio para anexos de áudio
    - Você precisa da variável de ambiente da chave da API SenseAudio ou do caminho de configuração de áudio
summary: Transcrição de fala em texto em lote com o SenseAudio para mensagens de voz recebidas
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T00:20:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio transcreve anexos de áudio e mensagens de voz recebidos por meio do pipeline compartilhado `tools.media.audio` do OpenClaw. O OpenClaw envia o áudio como multipart para o endpoint de transcrição compatível com a OpenAI e injeta o texto retornado como `{{Transcript}}`, além de um bloco `[Audio]`.

| Propriedade       | Valor                                            |
| ----------------- | ------------------------------------------------ |
| ID do provedor    | `senseaudio`                                     |
| Plugin            | incluído, `enabledByDefault: true`                |
| Contrato          | `mediaUnderstandingProviders` (áudio)            |
| Variável de autenticação | `SENSEAUDIO_API_KEY`                      |
| Modelo padrão     | `senseaudio-asr-pro-1.5-260319`                  |
| URL padrão        | `https://api.senseaudio.cn/v1`                   |
| Site              | [senseaudio.cn](https://senseaudio.cn)           |
| Documentação      | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

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
  <Step title="Envie uma mensagem de voz">
    Envie uma mensagem de áudio por qualquer canal conectado. O OpenClaw envia o
    áudio ao SenseAudio e usa a transcrição no pipeline de resposta.
  </Step>
</Steps>

## Opções

| Opção      | Caminho                               | Descrição                                      |
| ---------- | ------------------------------------- | ---------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID do modelo ASR do SenseAudio                 |
| `language` | `tools.media.audio.models[].language` | Indicação opcional de idioma                   |
| `prompt`   | `tools.media.audio.prompt`            | Prompt opcional de transcrição                 |
| `baseUrl`  | `tools.media.audio.baseUrl` ou modelo | Substitui a base compatível com a OpenAI       |
| `headers`  | `tools.media.audio.request.headers`   | Cabeçalhos adicionais da solicitação           |

<Note>
No OpenClaw, o SenseAudio oferece apenas STT em lote. A transcrição em tempo real
de chamadas de voz continua usando provedores com suporte a STT por streaming.
</Note>

## Relacionado

- [Compreensão de mídia (áudio)](/pt-BR/nodes/audio)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
