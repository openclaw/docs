---
read_when:
    - Você quer síntese de fala da Inworld para respostas enviadas
    - Você precisa de saída de telefonia PCM ou nota de voz OGG_OPUS do Inworld
summary: Texto em fala por streaming da Inworld para respostas do OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:04:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld é um provedor de texto para fala (TTS) por streaming. No OpenClaw, ele
sintetiza áudio de resposta de saída (MP3 por padrão, OGG_OPUS para notas de voz)
e áudio PCM para canais de telefonia, como Voice Call.

O OpenClaw envia requisições ao endpoint de TTS por streaming da Inworld, concatena os
blocos de áudio em base64 retornados em um único buffer e entrega o resultado ao
pipeline padrão de áudio de resposta.

| Propriedade     | Valor                                                           |
| --------------- | --------------------------------------------------------------- |
| ID do provedor  | `inworld`                                                       |
| Plugin          | pacote externo oficial                                          |
| Contrato        | `speechProviders` (somente TTS)                                 |
| Variável de ambiente de autenticação | `INWORLD_API_KEY` (HTTP Basic, credencial do painel em Base64) |
| URL base        | `https://api.inworld.ai`                                        |
| Voz padrão      | `Sarah`                                                         |
| Modelo padrão   | `inworld-tts-1.5-max`                                           |
| Saída           | MP3 (padrão), OGG_OPUS (notas de voz), PCM 22050 Hz (telefonia) |
| Site            | [inworld.ai](https://inworld.ai)                                |
| Documentação    | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

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
              speakerVoiceId: "Sarah",
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

| Opção            | Caminho                                         | Descrição                                                         |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Credencial do painel em Base64. Usa `INWORLD_API_KEY` como fallback. |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Substitui a URL base da API da Inworld (padrão `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Identificador da voz (padrão `Sarah`).                            |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | ID do modelo de TTS (padrão `inworld-tts-1.5-max`).               |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Temperatura de amostragem `0..2` (opcional).                      |

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    A Inworld usa autenticação HTTP Basic com uma única string de credencial
    codificada em Base64. Copie-a literalmente do painel da Inworld. O provedor a envia
    como `Authorization: Basic <apiKey>` sem nenhuma codificação adicional, portanto
    não a codifique em Base64 você mesmo e não passe um token no estilo bearer.
    Consulte [observações de autenticação de TTS](/pt-BR/tools/tts#inworld-primary) para o mesmo aviso.
  </Accordion>
  <Accordion title="Modelos">
    IDs de modelo compatíveis: `inworld-tts-1.5-max` (padrão),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Saídas de áudio">
    As respostas usam MP3 por padrão. Quando o destino do canal é `voice-note`,
    o OpenClaw solicita `OGG_OPUS` à Inworld para que o áudio seja reproduzido como um balão
    de voz nativo. A síntese para telefonia usa `PCM` bruto a 22050 Hz para alimentar
    a ponte de telefonia.
  </Accordion>
  <Accordion title="Endpoints personalizados">
    Substitua o host da API com `messages.tts.providers.inworld.baseUrl`.
    Barras finais são removidas antes do envio das requisições.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Texto para fala" href="/pt-BR/tools/tts" icon="waveform-lines">
    Visão geral de TTS, provedores e configuração de `messages.tts`.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo definições de `messages.tts`.
  </Card>
  <Card title="Provedores" href="/pt-BR/providers" icon="grid">
    Todos os provedores compatíveis do OpenClaw.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
</CardGroup>
