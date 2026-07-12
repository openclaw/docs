---
read_when:
    - Você quer usar a síntese de fala do Azure nas respostas enviadas
    - Você precisa de saída nativa de mensagem de voz em Ogg Opus do Azure Speech
summary: Conversão de texto em fala do Azure AI Speech para respostas do OpenClaw
title: Fala do Azure
x-i18n:
    generated_at: "2026-07-12T15:38:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

O Azure Speech é um provedor integrado de conversão de texto em fala do Azure AI Speech. O OpenClaw
chama a API REST do Azure Speech diretamente com SSML, sintetizando MP3 para
respostas padrão, Ogg/Opus nativo para mensagens de voz e mulaw de 8 kHz para
canais de telefonia, como Voice Call. A solicitação envia o formato de saída
definido pelo provedor por meio do cabeçalho `X-Microsoft-OutputFormat`.

| Detalhe                         | Valor                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID do provedor                  | `azure-speech` (alias: `azure`)                                                                                |
| Site                            | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentação                    | [Conversão de texto em fala pela API REST do Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autenticação                    | `AZURE_SPEECH_KEY` mais `AZURE_SPEECH_REGION`                                                                  |
| Voz padrão                      | `en-US-JennyNeural`                                                                                            |
| Saída de arquivo padrão         | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Arquivo padrão de mensagem de voz | `ogg-24khz-16bit-mono-opus`                                                                                  |

## Primeiros passos

<Steps>
  <Step title="Criar um recurso do Azure Speech">
    No portal do Azure, crie um recurso do Speech. Copie **KEY 1** em
    Resource Management > Keys and Endpoint e copie a localização do recurso,
    como `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Selecionar o Azure Speech em messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Enviar uma mensagem">
    Envie uma resposta por qualquer canal conectado. O OpenClaw sintetiza o áudio
    com o Azure Speech e entrega MP3 para áudio padrão ou Ogg/Opus quando
    o canal espera uma mensagem de voz.
  </Step>
</Steps>

## Opções de configuração

Todas as opções ficam em `messages.tts.providers["azure-speech"]`.

| Opção                   | Descrição                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `apiKey`                | Chave do recurso de Fala do Azure. Usa como alternativa `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`. |
| `region`                | Região do recurso de Fala do Azure. Usa como alternativa `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.                |
| `endpoint`              | Substituição opcional do endpoint de Fala do Azure. Usa como alternativa `AZURE_SPEECH_ENDPOINT`.                 |
| `baseUrl`               | Substituição opcional da URL base de Fala do Azure.                                                               |
| `voice`                 | ShortName da voz do Azure (padrão: `en-US-JennyNeural`). Alias legado: `voiceId`.                                 |
| `lang`                  | Código de idioma SSML (padrão: `en-US`).                                                                          |
| `outputFormat`          | Formato de saída do arquivo de áudio (padrão: `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | Formato de saída da mensagem de voz (padrão: `ogg-24khz-16bit-mono-opus`).                                        |
| `timeoutMs`             | Substituição do tempo limite da solicitação em milissegundos. Usa como alternativa o valor global `messages.tts.timeoutMs`. |

O provedor é considerado configurado quando `apiKey` está definido junto com um dos valores
`region`, `endpoint` ou `baseUrl`. As variáveis de ambiente são verificadas apenas como alternativa
para chaves de configuração que não foram definidas.

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    O Azure Speech usa uma chave de recurso de Fala, não uma chave do Azure OpenAI. A chave
    é enviada como `Ocp-Apim-Subscription-Key`; o OpenClaw deriva
    `https://<region>.tts.speech.microsoft.com` de `region`, a menos que você
    forneça `endpoint` ou `baseUrl`.
  </Accordion>
  <Accordion title="Nomes de voz">
    Use o valor `ShortName` da voz do Azure Speech, por exemplo,
    `en-US-JennyNeural`. O provedor incluído pode listar as vozes usando o
    mesmo recurso de Fala e filtra as vozes marcadas como obsoletas, descontinuadas
    ou desabilitadas.
  </Accordion>
  <Accordion title="Saídas de áudio">
    O Azure aceita formatos de saída como `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` e `riff-24khz-16bit-mono-pcm`. O OpenClaw
    solicita Ogg/Opus para destinos `voice-note`, para que os canais possam enviar
    balões de voz nativos sem uma conversão adicional para MP3, e força
    `raw-8khz-8bit-mono-mulaw` para destinos de telefonia.
  </Accordion>
  <Accordion title="Alias">
    `azure` é aceito como alias de provedor para configurações existentes, mas novas
    configurações devem usar `azure-speech` para evitar confusão com provedores de
    modelos do Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Texto para fala" href="/pt-BR/tools/tts" icon="waveform-lines">
    Visão geral de TTS, provedores e configuração de `messages.tts`.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo as opções de `messages.tts`.
  </Card>
  <Card title="Provedores" href="/pt-BR/providers" icon="grid">
    Todos os provedores incluídos no OpenClaw.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
</CardGroup>
