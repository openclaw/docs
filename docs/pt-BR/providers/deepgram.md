---
read_when:
    - Você quer speech-to-text da Deepgram para anexos de áudio
    - Você quer transcrição em streaming da Deepgram para Voice Call
    - Você precisa de um exemplo rápido de configuração da Deepgram
summary: Transcrição com Deepgram para notas de voz de entrada
title: Deepgram
x-i18n:
    generated_at: "2026-04-25T13:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
---

Deepgram é uma API de speech-to-text. No OpenClaw, ela é usada para transcrição
de áudio/notas de voz de entrada por meio de `tools.media.audio` e para STT em streaming do Voice Call por meio de `plugins.entries.voice-call.config.streaming`.

Para transcrição em lote, o OpenClaw faz upload do arquivo de áudio completo para a Deepgram
e injeta a transcrição no pipeline de resposta (`{{Transcript}}` +
bloco `[Audio]`). Para STT em streaming do Voice Call, o OpenClaw encaminha frames
ao vivo G.711 u-law pelo endpoint WebSocket `listen` da Deepgram e emite transcrições
parciais ou finais conforme a Deepgram as retorna.

| Detalhe       | Valor                                                      |
| ------------- | ---------------------------------------------------------- |
| Site          | [deepgram.com](https://deepgram.com)                       |
| Documentação  | [developers.deepgram.com](https://developers.deepgram.com) |
| Auth          | `DEEPGRAM_API_KEY`                                         |
| Modelo padrão | `nova-3`                                                   |

## Primeiros passos

<Steps>
  <Step title="Defina sua chave de API">
    Adicione sua chave de API da Deepgram ao ambiente:

    ```
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
  <Step title="Envie uma nota de voz">
    Envie uma mensagem de áudio por qualquer canal conectado. O OpenClaw a transcreve
    pela Deepgram e injeta a transcrição no pipeline de resposta.
  </Step>
</Steps>

## Opções de configuração

| Opção             | Caminho                                                      | Descrição                             |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | ID do modelo da Deepgram (padrão: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Dica de idioma (opcional)             |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Ativa detecção de idioma (opcional)   |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Ativa pontuação (opcional)            |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Ativa formatação inteligente (opcional) |

<Tabs>
  <Tab title="Com dica de idioma">
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

## STT em streaming do Voice Call

O Plugin empacotado `deepgram` também registra um provedor de transcrição em tempo real
para o Plugin Voice Call.

| Configuração     | Caminho de configuração                                                 | Padrão                           |
| ---------------- | ----------------------------------------------------------------------- | -------------------------------- |
| Chave de API     | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Usa `DEEPGRAM_API_KEY` como fallback |
| Modelo           | `...deepgram.model`                                                     | `nova-3`                         |
| Idioma           | `...deepgram.language`                                                  | (não definido)                   |
| Codificação      | `...deepgram.encoding`                                                  | `mulaw`                          |
| Taxa de amostra  | `...deepgram.sampleRate`                                                | `8000`                           |
| Endpointing      | `...deepgram.endpointingMs`                                             | `800`                            |
| Resultados parciais | `...deepgram.interimResults`                                         | `true`                           |

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
O Voice Call recebe áudio de telefonia em 8 kHz G.711 u-law. O provedor de
streaming da Deepgram usa como padrão `encoding: "mulaw"` e `sampleRate: 8000`, então
frames de mídia do Twilio podem ser encaminhados diretamente.
</Note>

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    A autenticação segue a ordem padrão de autenticação de provedor. `DEEPGRAM_API_KEY` é
    o caminho mais simples.
  </Accordion>
  <Accordion title="Proxy e endpoints personalizados">
    Substitua endpoints ou cabeçalhos com `tools.media.audio.baseUrl` e
    `tools.media.audio.headers` ao usar um proxy.
  </Accordion>
  <Accordion title="Comportamento da saída">
    A saída segue as mesmas regras de áudio dos outros provedores (limites de tamanho, timeouts,
    injeção de transcrição).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Media tools" href="/pt-BR/tools/media-overview" icon="photo-film">
    Visão geral do pipeline de processamento de áudio, imagem e vídeo.
  </Card>
  <Card title="Configuration" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo ajustes de ferramentas de mídia.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
  <Card title="FAQ" href="/pt-BR/help/faq" icon="circle-question">
    Perguntas frequentes sobre a configuração do OpenClaw.
  </Card>
</CardGroup>
