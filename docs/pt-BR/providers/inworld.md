---
read_when:
    - Você quer a síntese de voz da Inworld para respostas enviadas
    - Você precisa de saída de telefonia PCM ou de mensagem de voz OGG_OPUS da Inworld
summary: Conversão de texto em fala por streaming do Inworld para respostas do OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T00:19:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld é um provedor de conversão de texto em fala (TTS) por streaming. No OpenClaw, ele sintetiza o áudio de respostas de saída (MP3 por padrão, OGG_OPUS para mensagens de voz) e áudio PCM bruto para canais de telefonia, como Voice Call.

O OpenClaw envia solicitações ao endpoint de TTS por streaming da Inworld, concatena os blocos de áudio em base64 retornados em um único buffer e encaminha o resultado ao pipeline padrão de áudio de resposta.

| Propriedade     | Valor                                                               |
| --------------- | ------------------------------------------------------------------- |
| ID do provedor  | `inworld`                                                           |
| Plugin          | pacote externo oficial (`@openclaw/inworld-speech`)                 |
| Contrato        | `speechProviders` (somente TTS)                                     |
| Var. de amb. de autenticação | `INWORLD_API_KEY` (HTTP Basic, credencial Base64 do painel) |
| URL base        | `https://api.inworld.ai`                                            |
| Voz padrão      | `Sarah`                                                             |
| Modelo padrão   | `inworld-tts-1.5-max`                                               |
| Saída           | MP3 (padrão), OGG_OPUS (mensagens de voz), PCM 22050 Hz (telefonia) |
| Site            | [inworld.ai](https://inworld.ai)                                    |
| Documentação    | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)          |

## Instalar o plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Defina sua chave de API">
    Copie a credencial do painel da Inworld (Workspace > API Keys) e defina-a como uma variável de ambiente. O valor é enviado literalmente como a credencial HTTP Basic; portanto, não o codifique novamente em Base64 nem o converta em um token bearer.

    ```bash
    INWORLD_API_KEY=<credencial-base64-do-painel>
    ```

  </Step>
  <Step title="Selecione a Inworld em messages.tts">
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
    Envie uma resposta por qualquer canal conectado. O OpenClaw sintetiza o áudio com a Inworld e o entrega como MP3 (ou OGG_OPUS quando o canal espera uma mensagem de voz).
  </Step>
</Steps>

## Opções de configuração

| Opção         | Caminho                                      | Descrição                                                               |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Credencial Base64 do painel. Usa `INWORLD_API_KEY` como alternativa.    |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Substitui a URL base da API da Inworld (padrão: `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identificador da voz (padrão: `Sarah`). Alias legado: `speakerVoiceId`. |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID do modelo de TTS (padrão: `inworld-tts-1.5-max`).                    |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura de amostragem, de `0` (exclusivo) a `2` (opcional).         |

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    A Inworld usa autenticação HTTP Basic com uma única string de credencial codificada em Base64. Copie-a literalmente do painel da Inworld. O provedor a envia como `Authorization: Basic <apiKey>` sem nenhuma codificação adicional; portanto, não a codifique você mesmo em Base64 nem forneça um token no formato bearer. Consulte as [observações sobre autenticação de TTS](/pt-BR/tools/tts#inworld-primary) para ver o mesmo aviso.
  </Accordion>
  <Accordion title="Modelos">
    IDs de modelos compatíveis: `inworld-tts-1.5-max` (padrão), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Saídas de áudio">
    As respostas usam MP3 por padrão. Quando o destino do canal é `voice-note`, o OpenClaw solicita `OGG_OPUS` à Inworld para que o áudio seja reproduzido como um balão de voz nativo. A síntese para telefonia usa `PCM` bruto a 22050 Hz para alimentar a ponte de telefonia.
  </Accordion>
  <Accordion title="Endpoints personalizados">
    Substitua o host da API com `messages.tts.providers.inworld.baseUrl`. As barras finais são removidas antes do envio das solicitações.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Conversão de texto em fala" href="/pt-BR/tools/tts" icon="waveform-lines">
    Visão geral de TTS, provedores e configuração de `messages.tts`.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa da configuração, incluindo as definições de `messages.tts`.
  </Card>
  <Card title="Provedores" href="/pt-BR/providers" icon="grid">
    Todos os provedores compatíveis com o OpenClaw.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
</CardGroup>
