---
read_when:
    - Você quer speech-to-text da Deepgram para anexos de áudio
    - Você quer transcrição em streaming da Deepgram para Voice Call
    - Você precisa de um exemplo rápido de configuração do Deepgram
summary: Transcrição Deepgram para mensagens de voz recebidas
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T14:06:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Transcrição de áudio)

Deepgram é uma API de speech-to-text. No OpenClaw, ela é usada para
transcrição de áudio/mensagens de voz recebidas por meio de `tools.media.audio` e para
STT em streaming do Voice Call por meio de `plugins.entries.voice-call.config.streaming`.

Para transcrição em lote, o OpenClaw envia o arquivo de áudio completo para a Deepgram
e injeta a transcrição no pipeline de resposta (`{{Transcript}}` +
bloco `[Audio]`). Para streaming do Voice Call, o OpenClaw encaminha frames
G.711 u-law ao vivo pelo endpoint WebSocket `listen` da Deepgram e emite transcrições
parciais ou finais conforme a Deepgram as retorna.

| Detalhe       | Valor                                                      |
| ------------- | ---------------------------------------------------------- |
| Site          | [deepgram.com](https://deepgram.com)                       |
| Docs          | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticação  | `DEEPGRAM_API_KEY`                                         |
| Modelo padrão | `nova-3`                                                   |

## Introdução

<Steps>
  <Step title="Definir sua chave de API">
    Adicione sua chave de API da Deepgram ao ambiente:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Habilitar o provedor de áudio">
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
  <Step title="Enviar uma mensagem de voz">
    Envie uma mensagem de áudio por qualquer canal conectado. O OpenClaw a transcreve
    via Deepgram e injeta a transcrição no pipeline de resposta.
  </Step>
</Steps>

## Opções de configuração

| Opção            | Caminho                                                      | Descrição                           |
| ---------------- | ------------------------------------------------------------ | ----------------------------------- |
| `model`          | `tools.media.audio.models[].model`                           | id do modelo Deepgram (padrão: `nova-3`) |
| `language`       | `tools.media.audio.models[].language`                        | dica de idioma (opcional)           |
| `detect_language`| `tools.media.audio.providerOptions.deepgram.detect_language` | habilita detecção de idioma (opcional) |
| `punctuate`      | `tools.media.audio.providerOptions.deepgram.punctuate`       | habilita pontuação (opcional)       |
| `smart_format`   | `tools.media.audio.providerOptions.deepgram.smart_format`    | habilita formatação inteligente (opcional) |

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
  <Tab title="Com opções Deepgram">
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

O plugin integrado `deepgram` também registra um provedor de transcrição em tempo real
para o plugin Voice Call.

| Configuração     | Caminho de configuração                                                  | Padrão                           |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------- |
| Chave de API     | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey`  | Usa `DEEPGRAM_API_KEY` como fallback |
| Modelo           | `...deepgram.model`                                                      | `nova-3`                         |
| Idioma           | `...deepgram.language`                                                   | (não definido)                   |
| Codificação      | `...deepgram.encoding`                                                   | `mulaw`                          |
| Taxa de amostragem | `...deepgram.sampleRate`                                               | `8000`                           |
| Endpointing      | `...deepgram.endpointingMs`                                              | `800`                            |
| Resultados intermediários | `...deepgram.interimResults`                                     | `true`                           |

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
O Voice Call recebe áudio de telefonia como G.711 u-law a 8 kHz. O provedor
de streaming Deepgram usa por padrão `encoding: "mulaw"` e `sampleRate: 8000`, então
frames de mídia do Twilio podem ser encaminhados diretamente.
</Note>

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    A autenticação segue a ordem padrão de autenticação do provedor. `DEEPGRAM_API_KEY` é
    o caminho mais simples.
  </Accordion>
  <Accordion title="Proxy e endpoints personalizados">
    Substitua endpoints ou headers com `tools.media.audio.baseUrl` e
    `tools.media.audio.headers` ao usar um proxy.
  </Accordion>
  <Accordion title="Comportamento da saída">
    A saída segue as mesmas regras de áudio dos outros provedores (limites de tamanho, timeouts,
    injeção de transcrição).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Ferramentas de mídia" href="/pt-BR/tools/media-overview" icon="photo-film">
    Visão geral do pipeline de processamento de áudio, imagem e vídeo.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo ajustes de ferramentas de mídia.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
  <Card title="FAQ" href="/pt-BR/help/faq" icon="circle-question">
    Perguntas frequentes sobre a configuração do OpenClaw.
  </Card>
</CardGroup>
