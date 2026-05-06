---
read_when:
    - Você quer síntese de fala da Inworld para respostas de saída
    - Você precisa de saída de telefonia PCM ou de nota de voz OGG_OPUS da Inworld
summary: Texto para fala em streaming da Inworld para respostas do OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-05-06T09:10:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld é um provedor de texto para fala (TTS) por streaming. No OpenClaw, ele
sintetiza o áudio de respostas de saída (MP3 por padrão, OGG_OPUS para notas de voz)
e áudio PCM para canais de telefonia, como Chamada de voz.

O OpenClaw envia requisições para o endpoint de TTS por streaming da Inworld, concatena os
fragmentos de áudio em base64 retornados em um único buffer e entrega o resultado ao
pipeline padrão de áudio de resposta.

| Propriedade   | Valor                                                           |
| ------------- | --------------------------------------------------------------- |
| ID do provedor | `inworld`                                                      |
| Plugin        | incluído, `enabledByDefault: true`                              |
| Contrato      | `speechProviders` (somente TTS)                                 |
| Variável de ambiente de autenticação | `INWORLD_API_KEY` (HTTP Basic, credencial Base64 do painel) |
| URL base      | `https://api.inworld.ai`                                        |
| Voz padrão    | `Sarah`                                                         |
| Modelo padrão | `inworld-tts-1.5-max`                                           |
| Saída         | MP3 (padrão), OGG_OPUS (notas de voz), PCM 22050 Hz (telefonia) |
| Site          | [inworld.ai](https://inworld.ai)                                |
| Documentação  | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Primeiros passos

<Steps>
  <Step title="Defina sua chave de API">
    Copie a credencial do seu painel da Inworld (Workspace > API Keys)
    e defina-a como uma variável de ambiente. O valor é enviado literalmente como a
    credencial HTTP Basic, portanto não o codifique em Base64 novamente nem o converta
    em um token bearer.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
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
    espera uma nota de voz).
  </Step>
</Steps>

## Opções de configuração

| Opção         | Caminho                                      | Descrição                                                        |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Credencial Base64 do painel. Usa `INWORLD_API_KEY` como fallback. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Substitui a URL base da API da Inworld (padrão `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identificador de voz (padrão `Sarah`).                           |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID do modelo TTS (padrão `inworld-tts-1.5-max`).                 |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura de amostragem `0..2` (opcional).                     |

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    A Inworld usa autenticação HTTP Basic com uma única string de credencial
    codificada em Base64. Copie-a literalmente do painel da Inworld. O provedor a envia
    como `Authorization: Basic <apiKey>` sem nenhuma codificação adicional, portanto
    não a codifique em Base64 você mesmo e não passe um token no estilo bearer.
    Consulte [observações de autenticação de TTS](/pt-BR/tools/tts#inworld-primary) para o mesmo destaque.
  </Accordion>
  <Accordion title="Modelos">
    IDs de modelo compatíveis: `inworld-tts-1.5-max` (padrão),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Saídas de áudio">
    As respostas usam MP3 por padrão. Quando o destino do canal é `voice-note`,
    o OpenClaw solicita `OGG_OPUS` à Inworld para que o áudio seja reproduzido como uma
    bolha de voz nativa. A síntese de telefonia usa `PCM` bruto a 22050 Hz para alimentar
    a ponte de telefonia.
  </Accordion>
  <Accordion title="Endpoints personalizados">
    Substitua o host da API com `messages.tts.providers.inworld.baseUrl`.
    Barras finais são removidas antes do envio das requisições.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Texto para fala" href="/pt-BR/tools/tts" icon="waveform-lines">
    Visão geral de TTS, provedores e configuração de `messages.tts`.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo definições de `messages.tts`.
  </Card>
  <Card title="Provedores" href="/pt-BR/providers" icon="grid">
    Todos os provedores incluídos do OpenClaw.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
</CardGroup>
