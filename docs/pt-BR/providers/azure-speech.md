---
read_when:
    - Você quer síntese de fala do Azure Speech para respostas enviadas
    - Você precisa de saída nativa de notas de voz Ogg Opus do Azure Speech
summary: Texto para fala do Azure AI Speech para respostas do OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:01:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech é um provedor de conversão de texto em fala do Azure AI Speech. No OpenClaw, ele
sintetiza áudio de respostas de saída como MP3 por padrão, Ogg/Opus nativo para notas
de voz e áudio mulaw de 8 kHz para canais de telefonia, como Chamada de voz.

O OpenClaw usa a API REST do Azure Speech diretamente com SSML e envia o
formato de saída pertencente ao provedor por meio de `X-Microsoft-OutputFormat`.

| Detalhe                 | Valor                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Site                    | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentação            | [REST de fala para texto do Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autenticação            | `AZURE_SPEECH_KEY` mais `AZURE_SPEECH_REGION`                                                                  |
| Voz padrão              | `en-US-JennyNeural`                                                                                            |
| Saída de arquivo padrão | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Arquivo padrão de nota de voz | `ogg-24khz-16bit-mono-opus`                                                                                    |

## Primeiros passos

<Steps>
  <Step title="Create an Azure Speech resource">
    No portal do Azure, crie um recurso Speech. Copie **KEY 1** em
    Resource Management > Keys and Endpoint e copie a localização do recurso,
    como `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Select Azure Speech in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    Envie uma resposta por qualquer canal conectado. O OpenClaw sintetiza o áudio
    com o Azure Speech e entrega MP3 para áudio padrão, ou Ogg/Opus quando
    o canal espera uma nota de voz.
  </Step>
</Steps>

## Opções de configuração

| Opção                   | Caminho                                                     | Descrição                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Chave do recurso Azure Speech. Usa como fallback `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Região do recurso Azure Speech. Usa como fallback `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Substituição opcional de endpoint/URL base do Azure Speech.                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Substituição opcional da URL base do Azure Speech.                                                              |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | ShortName da voz do Azure (padrão `en-US-JennyNeural`). Alias legado: `voice`.                           |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Código de idioma SSML (padrão `en-US`).                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Formato de saída do arquivo de áudio (padrão `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Formato de saída de nota de voz (padrão `ogg-24khz-16bit-mono-opus`).                                       |

## Observações

<AccordionGroup>
  <Accordion title="Authentication">
    O Azure Speech usa uma chave de recurso Speech, não uma chave do Azure OpenAI. A chave
    é enviada como `Ocp-Apim-Subscription-Key`; o OpenClaw deriva
    `https://<region>.tts.speech.microsoft.com` de `region`, a menos que você
    forneça `endpoint` ou `baseUrl`.
  </Accordion>
  <Accordion title="Voice names">
    Use o valor `ShortName` da voz do Azure Speech, por exemplo
    `en-US-JennyNeural`. O provedor incluído pode listar vozes por meio do
    mesmo recurso Speech e filtra vozes marcadas como obsoletas ou retiradas.
  </Accordion>
  <Accordion title="Audio outputs">
    O Azure aceita formatos de saída como `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` e `riff-24khz-16bit-mono-pcm`. O OpenClaw
    solicita Ogg/Opus para destinos `voice-note`, para que os canais possam enviar bolhas
    de voz nativas sem uma conversão extra para MP3.
  </Accordion>
  <Accordion title="Alias">
    `azure` é aceito como alias de provedor para PRs existentes e configuração do usuário,
    mas novas configurações devem usar `azure-speech` para evitar confusão com provedores
    de modelos Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/pt-BR/tools/tts" icon="waveform-lines">
    Visão geral de TTS, provedores e configuração de `messages.tts`.
  </Card>
  <Card title="Configuration" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo definições de `messages.tts`.
  </Card>
  <Card title="Providers" href="/pt-BR/providers" icon="grid">
    Todos os provedores incluídos no OpenClaw.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
</CardGroup>
