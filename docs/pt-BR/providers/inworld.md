---
read_when:
    - Você quer síntese de fala da Inworld para respostas de saída
    - Você precisa de saída PCM para telefonia ou OGG_OPUS para mensagens de voz da Inworld
summary: Text-to-speech com streaming da Inworld para respostas do OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:36:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

A Inworld é um provedor de text-to-speech (TTS) com streaming. No OpenClaw, ela
sintetiza áudio de respostas de saída (MP3 por padrão, OGG_OPUS para mensagens de voz)
e áudio PCM para canais de telefonia, como Voice Call.

O OpenClaw envia requisições ao endpoint de streaming TTS da Inworld, concatena os
chunks de áudio em base64 retornados em um único buffer e entrega o resultado
ao pipeline padrão de áudio de resposta.

| Detalhe      | Valor                                                       |
| ------------ | ----------------------------------------------------------- |
| Site         | [inworld.ai](https://inworld.ai)                            |
| Documentação | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Auth         | `INWORLD_API_KEY` (HTTP Basic, credencial Base64 do dashboard) |
| Voz padrão   | `Sarah`                                                     |
| Modelo padrão | `inworld-tts-1.5-max`                                      |

## Primeiros passos

<Steps>
  <Step title="Defina sua chave de API">
    Copie a credencial do seu dashboard da Inworld (Workspace > API Keys)
    e defina-a como uma variável de env. O valor é enviado literalmente como a
    credencial HTTP Basic, então não o codifique em Base64 novamente nem o converta
    para um token bearer.

    ```
    INWORLD_API_KEY=<credencial-base64-do-dashboard>
    ```

  </Step>
  <Step title="Selecione Inworld em messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envie uma mensagem">
    Envie uma resposta por qualquer canal conectado. O OpenClaw sintetiza o
    áudio com a Inworld e o entrega como MP3 (ou OGG_OPUS quando o canal
    espera uma mensagem de voz).
  </Step>
</Steps>

## Opções de configuração

| Opção         | Caminho                                      | Descrição                                                         |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Credencial Base64 do dashboard. Faz fallback para `INWORLD_API_KEY`. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Substitui a URL base da API da Inworld (padrão `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identificador da voz (padrão `Sarah`).                            |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID do modelo TTS (padrão `inworld-tts-1.5-max`).                  |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura de sampling `0..2` (opcional).                        |

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    A Inworld usa auth HTTP Basic com uma única string de credencial codificada em Base64.
    Copie-a literalmente do dashboard da Inworld. O provedor a envia
    como `Authorization: Basic <apiKey>` sem nenhuma codificação adicional, então
    não a codifique você mesmo em Base64 nem passe um token no estilo bearer.
    Consulte [Observações de auth do TTS](/pt-BR/tools/tts#inworld-primary) para o mesmo alerta.
  </Accordion>
  <Accordion title="Modelos">
    IDs de modelo compatíveis: `inworld-tts-1.5-max` (padrão),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Saídas de áudio">
    As respostas usam MP3 por padrão. Quando o destino do canal é `voice-note`,
    o OpenClaw solicita `OGG_OPUS` à Inworld para que o áudio seja reproduzido como uma
    bolha nativa de voz. A síntese para telefonia usa `PCM` bruto a 22050 Hz para alimentar
    a ponte de telefonia.
  </Accordion>
  <Accordion title="Endpoints personalizados">
    Substitua o host da API com `messages.tts.providers.inworld.baseUrl`.
    Barras finais são removidas antes do envio das requisições.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/pt-BR/tools/tts" icon="waveform-lines">
    Visão geral de TTS, provedores e configuração de `messages.tts`.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo ajustes de `messages.tts`.
  </Card>
  <Card title="Providers" href="/pt-BR/providers" icon="grid">
    Todos os provedores incluídos do OpenClaw.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
</CardGroup>
