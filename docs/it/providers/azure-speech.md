---
read_when:
    - Vuoi la sintesi vocale di Azure Speech per le risposte in uscita
    - Ti serve un output nativo per note vocali Ogg Opus da Azure Speech
summary: Sintesi vocale di Azure AI Speech per le risposte di OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:05:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech è un provider di sintesi vocale da testo di Azure AI Speech. In OpenClaw
sintetizza l'audio delle risposte in uscita come MP3 per impostazione predefinita,
Ogg/Opus nativo per le note vocali e audio mulaw a 8 kHz per canali di telefonia
come le chiamate vocali.

OpenClaw usa direttamente l'API REST di Azure Speech con SSML e invia il formato
di output di proprietà del provider tramite `X-Microsoft-OutputFormat`.

| Dettaglio               | Valore                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Sito web                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentazione          | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autenticazione          | `AZURE_SPEECH_KEY` più `AZURE_SPEECH_REGION`                                                                   |
| Voce predefinita        | `en-US-JennyNeural`                                                                                            |
| Output file predefinito | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| File nota vocale predefinito | `ogg-24khz-16bit-mono-opus`                                                                               |

## Introduzione

<Steps>
  <Step title="Create an Azure Speech resource">
    Nel portale Azure, crea una risorsa Speech. Copia **KEY 1** da
    Resource Management > Keys and Endpoint e copia la posizione della risorsa,
    ad esempio `eastus`.

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
    Invia una risposta tramite qualsiasi canale connesso. OpenClaw sintetizza
    l'audio con Azure Speech e consegna MP3 per l'audio standard, oppure Ogg/Opus
    quando il canale prevede una nota vocale.
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione                 | Percorso                                                    | Descrizione                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Chiave della risorsa Azure Speech. Ripiega su `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Area della risorsa Azure Speech. Ripiega su `AZURE_SPEECH_REGION` o `SPEECH_REGION`.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Override opzionale dell'endpoint/URL di base di Azure Speech.                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Override opzionale dell'URL di base di Azure Speech.                                                              |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | `ShortName` della voce Azure (predefinito `en-US-JennyNeural`). Alias legacy: `voice`.                           |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Codice lingua SSML (predefinito `en-US`).                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Formato di output del file audio (predefinito `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Formato di output della nota vocale (predefinito `ogg-24khz-16bit-mono-opus`).                                       |

## Note

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech usa una chiave di risorsa Speech, non una chiave Azure OpenAI.
    La chiave viene inviata come `Ocp-Apim-Subscription-Key`; OpenClaw deriva
    `https://<region>.tts.speech.microsoft.com` da `region` a meno che tu non
    fornisca `endpoint` o `baseUrl`.
  </Accordion>
  <Accordion title="Voice names">
    Usa il valore `ShortName` della voce Azure Speech, ad esempio
    `en-US-JennyNeural`. Il provider incluso può elencare le voci tramite la
    stessa risorsa Speech e filtra le voci contrassegnate come deprecate o ritirate.
  </Accordion>
  <Accordion title="Audio outputs">
    Azure accetta formati di output come `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` e `riff-24khz-16bit-mono-pcm`. OpenClaw
    richiede Ogg/Opus per le destinazioni `voice-note` in modo che i canali
    possano inviare bolle vocali native senza una conversione MP3 aggiuntiva.
  </Accordion>
  <Accordion title="Alias">
    `azure` è accettato come alias del provider per PR e configurazioni utente
    esistenti, ma le nuove configurazioni dovrebbero usare `azure-speech` per
    evitare confusione con i provider di modelli Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/it/tools/tts" icon="waveform-lines">
    Panoramica TTS, provider e configurazione `messages.tts`.
  </Card>
  <Card title="Configuration" href="/it/gateway/configuration" icon="gear">
    Riferimento completo alla configurazione, incluse le impostazioni `messages.tts`.
  </Card>
  <Card title="Providers" href="/it/providers" icon="grid">
    Tutti i provider OpenClaw inclusi.
  </Card>
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi di debug.
  </Card>
</CardGroup>
