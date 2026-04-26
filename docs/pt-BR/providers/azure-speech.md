---
read_when:
    - Você quer síntese do Azure Speech para respostas de saída
    - Você precisa de saída nativa de nota de voz em Ogg Opus do Azure Speech
summary: Conversão de texto em fala do Azure AI Speech para respostas do OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:36:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech é um provedor de conversão de texto em fala do Azure AI Speech. No OpenClaw, ele sintetiza áudio de respostas de saída como MP3 por padrão, Ogg/Opus nativo para notas de voz e áudio mulaw de 8 kHz para canais de telefonia, como Voice Call.

O OpenClaw usa diretamente a API REST do Azure Speech com SSML e envia o formato de saída pertencente ao provedor por meio de `X-Microsoft-OutputFormat`.

| Detalhe                 | Valor                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Site                    | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentação            | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autenticação            | `AZURE_SPEECH_KEY` mais `AZURE_SPEECH_REGION`                                                                  |
| Voz padrão              | `en-US-JennyNeural`                                                                                            |
| Saída de arquivo padrão | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Arquivo padrão de nota de voz | `ogg-24khz-16bit-mono-opus`                                                                              |

## Primeiros passos

<Steps>
  <Step title="Criar um recurso do Azure Speech">
    No portal do Azure, crie um recurso Speech. Copie a **KEY 1** em
    Resource Management > Keys and Endpoint e copie a localização do recurso,
    como `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Selecionar Azure Speech em messages.tts">
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
    com o Azure Speech e entrega MP3 para áudio padrão, ou Ogg/Opus quando
    o canal espera uma nota de voz.
  </Step>
</Steps>

## Opções de configuração

| Opção                  | Caminho                                                     | Descrição                                                                                              |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `apiKey`               | `messages.tts.providers.azure-speech.apiKey`                | Chave do recurso Azure Speech. Usa `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY` como fallback. |
| `region`               | `messages.tts.providers.azure-speech.region`                | Região do recurso Azure Speech. Usa `AZURE_SPEECH_REGION` ou `SPEECH_REGION` como fallback.           |
| `endpoint`             | `messages.tts.providers.azure-speech.endpoint`              | Sobrescrita opcional do endpoint/base URL do Azure Speech.                                             |
| `baseUrl`              | `messages.tts.providers.azure-speech.baseUrl`               | Sobrescrita opcional da base URL do Azure Speech.                                                      |
| `voice`                | `messages.tts.providers.azure-speech.voice`                 | `ShortName` da voz do Azure (padrão `en-US-JennyNeural`).                                              |
| `lang`                 | `messages.tts.providers.azure-speech.lang`                  | Código de idioma SSML (padrão `en-US`).                                                                |
| `outputFormat`         | `messages.tts.providers.azure-speech.outputFormat`          | Formato de saída do arquivo de áudio (padrão `audio-24khz-48kbitrate-mono-mp3`).                      |
| `voiceNoteOutputFormat`| `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Formato de saída da nota de voz (padrão `ogg-24khz-16bit-mono-opus`).                                  |

## Observações

<AccordionGroup>
  <Accordion title="Autenticação">
    O Azure Speech usa uma chave de recurso Speech, não uma chave do Azure OpenAI. A chave
    é enviada como `Ocp-Apim-Subscription-Key`; o OpenClaw deriva
    `https://<region>.tts.speech.microsoft.com` de `region`, a menos que você
    forneça `endpoint` ou `baseUrl`.
  </Accordion>
  <Accordion title="Nomes de voz">
    Use o valor `ShortName` da voz do Azure Speech, por exemplo
    `en-US-JennyNeural`. O provedor empacotado pode listar vozes por meio do
    mesmo recurso Speech e filtra vozes marcadas como obsoletas ou descontinuadas.
  </Accordion>
  <Accordion title="Saídas de áudio">
    O Azure aceita formatos de saída como `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` e `riff-24khz-16bit-mono-pcm`. O OpenClaw
    solicita Ogg/Opus para destinos `voice-note`, para que os canais possam enviar
    bolhas de voz nativas sem uma conversão adicional para MP3.
  </Accordion>
  <Accordion title="Alias">
    `azure` é aceito como alias de provedor para PRs existentes e configuração de usuário,
    mas novas configurações devem usar `azure-speech` para evitar confusão com provedores
    de modelo do Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Conversão de texto em fala" href="/pt-BR/tools/tts" icon="waveform-lines">
    Visão geral de TTS, provedores e configuração de `messages.tts`.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração, incluindo definições de `messages.tts`.
  </Card>
  <Card title="Provedores" href="/pt-BR/providers" icon="grid">
    Todos os provedores empacotados do OpenClaw.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
</CardGroup>
