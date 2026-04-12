---
read_when:
    - Você quer speech-to-text da Deepgram para anexos de áudio
    - Você precisa de um exemplo rápido de configuração da Deepgram
summary: Transcrição com Deepgram para notas de voz recebidas
title: Deepgram
x-i18n:
    generated_at: "2026-04-12T23:30:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 091523d6669e3d258f07c035ec756bd587299b6c7025520659232b1b2c1e21a5
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Transcrição de áudio)

Deepgram é uma API de speech-to-text. No OpenClaw, ela é usada para **transcrição
de áudio/notas de voz recebidas** via `tools.media.audio`.

Quando habilitado, o OpenClaw envia o arquivo de áudio para a Deepgram e injeta a transcrição
no pipeline de resposta (`{{Transcript}}` + bloco `[Audio]`). Isso **não é streaming**;
usa o endpoint de transcrição de áudio pré-gravado.

| Detalhe       | Valor                                                      |
| ------------- | ---------------------------------------------------------- |
| Site          | [deepgram.com](https://deepgram.com)                       |
| Docs          | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticação  | `DEEPGRAM_API_KEY`                                         |
| Modelo padrão | `nova-3`                                                   |

## Primeiros passos

<Steps>
  <Step title="Defina sua chave de API">
    Adicione sua chave de API da Deepgram ao ambiente:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Habilite o provider de áudio">
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
    via Deepgram e injeta a transcrição no pipeline de resposta.
  </Step>
</Steps>

## Opções de configuração

| Opção            | Caminho                                                      | Descrição                              |
| ---------------- | ------------------------------------------------------------ | -------------------------------------- |
| `model`          | `tools.media.audio.models[].model`                           | ID do modelo Deepgram (padrão: `nova-3`) |
| `language`       | `tools.media.audio.models[].language`                        | Dica de idioma (opcional)              |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Habilita detecção de idioma (opcional) |
| `punctuate`      | `tools.media.audio.providerOptions.deepgram.punctuate`       | Habilita pontuação (opcional)          |
| `smart_format`   | `tools.media.audio.providerOptions.deepgram.smart_format`    | Habilita formatação inteligente (opcional) |

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

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    A autenticação segue a ordem padrão de autenticação de provider. `DEEPGRAM_API_KEY` é
    o caminho mais simples.
  </Accordion>
  <Accordion title="Proxy e endpoints personalizados">
    Sobrescreva endpoints ou cabeçalhos com `tools.media.audio.baseUrl` e
    `tools.media.audio.headers` ao usar um proxy.
  </Accordion>
  <Accordion title="Comportamento da saída">
    A saída segue as mesmas regras de áudio dos outros providers (limites de tamanho, timeouts,
    injeção de transcrição).
  </Accordion>
</AccordionGroup>

<Note>
A transcrição da Deepgram é **apenas para áudio pré-gravado** (não streaming em tempo real). O OpenClaw
envia o arquivo de áudio completo e aguarda a transcrição completa antes de injetá-la
na conversa.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Ferramentas de mídia" href="/tools/media" icon="photo-film">
    Visão geral do pipeline de processamento de áudio, imagem e vídeo.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo configurações da ferramenta de mídia.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
  <Card title="FAQ" href="/pt-BR/help/faq" icon="circle-question">
    Perguntas frequentes sobre a configuração do OpenClaw.
  </Card>
</CardGroup>
