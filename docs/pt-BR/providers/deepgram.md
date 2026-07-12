---
read_when:
    - Você quer usar a conversão de fala em texto da Deepgram para anexos de áudio
    - Você quer a transcrição por streaming da Deepgram para chamadas de voz
    - Você precisa de um exemplo rápido de configuração do Deepgram
summary: Transcrição da Deepgram para mensagens de voz recebidas
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T15:31:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram é uma API de conversão de fala em texto. O OpenClaw a utiliza para transcrever
áudios e mensagens de voz recebidos por meio de `tools.media.audio` e para STT por
streaming de chamadas de voz por meio de `plugins.entries.voice-call.config.streaming`.

A transcrição em lote envia o arquivo de áudio completo para a Deepgram e insere
a transcrição no pipeline de resposta (bloco `{{Transcript}}` + `[Audio]`).
O streaming de chamadas de voz encaminha quadros G.711 u-law em tempo real pelo
endpoint WebSocket `listen` da Deepgram e emite transcrições parciais/finais à
medida que a Deepgram as retorna.

| Detalhe       | Valor                                                      |
| ------------- | ---------------------------------------------------------- |
| Site          | [deepgram.com](https://deepgram.com)                       |
| Documentação  | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticação  | `DEEPGRAM_API_KEY`                                         |
| Modelo padrão | `nova-3`                                                   |

## Primeiros passos

<Steps>
  <Step title="Defina sua chave de API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Ative o provedor de áudio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envie uma mensagem de voz">
    Envie uma mensagem de áudio por qualquer canal conectado. O OpenClaw a transcreve
    por meio da Deepgram e insere a transcrição no pipeline de resposta.
  </Step>
</Steps>

## Opções de configuração

| Opção      | Caminho                               | Descrição                                  |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | ID do modelo da Deepgram (padrão: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Indicação de idioma (opcional)             |

`providerOptions.deepgram` combina parâmetros de consulta adicionais diretamente
com a solicitação `/listen` da Deepgram; portanto, qualquer nome de parâmetro
compatível com a Deepgram funciona (por exemplo, `detect_language`, `punctuate`,
`smart_format`):

<Tabs>
  <Tab title="Com indicação de idioma">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Com opções da Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## STT por streaming de chamadas de voz

O plugin `deepgram` incluído também registra um provedor de transcrição em tempo real
para o plugin de chamadas de voz.

| Configuração        | Caminho da configuração                                                  | Padrão                                    |
| ------------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| Chave de API        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Usa `DEEPGRAM_API_KEY` como alternativa   |
| Modelo              | `...deepgram.model`                                                     | `nova-3`                                  |
| Idioma              | `...deepgram.language`                                                  | (não definido)                            |
| Codificação         | `...deepgram.encoding`                                                  | `mulaw`                                   |
| Taxa de amostragem  | `...deepgram.sampleRate`                                                | `8000`                                    |
| Detecção de término | `...deepgram.endpointingMs`                                             | `800`                                     |
| Resultados parciais | `...deepgram.interimResults`                                            | `true`                                    |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
As chamadas de voz recebem áudio de telefonia como G.711 u-law a 8 kHz. O provedor
de streaming da Deepgram usa como padrão `encoding: "mulaw"` e `sampleRate: 8000`,
portanto, os quadros de mídia da Twilio podem ser encaminhados diretamente.
</Note>

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    A autenticação segue a ordem padrão de autenticação de provedores.
    `DEEPGRAM_API_KEY` é o caminho mais simples.
  </Accordion>
  <Accordion title="Proxy e endpoints personalizados">
    Substitua endpoints ou cabeçalhos por `tools.media.audio.baseUrl` e
    `tools.media.audio.headers` ao usar um proxy.
  </Accordion>
  <Accordion title="Comportamento da saída">
    A saída segue as mesmas regras de áudio dos outros provedores (limites de tamanho,
    tempos limite, inserção da transcrição).
  </Accordion>
</AccordionGroup>

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Ferramentas de mídia" href="/pt-BR/tools/media-overview" icon="photo-film">
    Visão geral do pipeline de processamento de áudio, imagem e vídeo.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo as configurações das ferramentas de mídia.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
  <Card title="Perguntas frequentes" href="/pt-BR/help/faq" icon="circle-question">
    Perguntas frequentes sobre a configuração do OpenClaw.
  </Card>
</CardGroup>
