---
read_when:
    - Vuoi usare la sintesi vocale di Azure per le risposte in uscita
    - Ti serve un output nativo per messaggi vocali in formato Ogg Opus da Azure Speech
summary: Sintesi vocale di Azure AI Speech per le risposte di OpenClaw
title: Sintesi vocale di Azure
x-i18n:
    generated_at: "2026-07-12T07:23:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech è un provider di sintesi vocale di Azure AI Speech incluso. OpenClaw
chiama direttamente l'API REST di Azure Speech con SSML, generando MP3 per
le risposte standard, Ogg/Opus nativo per i messaggi vocali e mulaw a 8 kHz per
i canali di telefonia come Voice Call. La richiesta invia il formato di output
gestito dal provider tramite l'header `X-Microsoft-OutputFormat`.

| Dettaglio                      | Valore                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| ID provider                    | `azure-speech` (alias: `azure`)                                                                                |
| Sito web                       | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentazione                 | [Sintesi vocale tramite REST di Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autenticazione                 | `AZURE_SPEECH_KEY` insieme a `AZURE_SPEECH_REGION`                                                             |
| Voce predefinita               | `en-US-JennyNeural`                                                                                            |
| Output file predefinito        | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| File predefinito per messaggi vocali | `ogg-24khz-16bit-mono-opus`                                                                              |

## Per iniziare

<Steps>
  <Step title="Crea una risorsa Azure Speech">
    Nel portale Azure, crea una risorsa Speech. Copia **KEY 1** da
    Resource Management > Keys and Endpoint e copia la posizione della risorsa,
    ad esempio `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Seleziona Azure Speech in messages.tts">
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
  <Step title="Invia un messaggio">
    Invia una risposta tramite qualsiasi canale connesso. OpenClaw sintetizza l'audio
    con Azure Speech e distribuisce un MP3 per l'audio standard oppure Ogg/Opus quando
    il canale richiede un messaggio vocale.
  </Step>
</Steps>

## Opzioni di configurazione

Tutte le opzioni si trovano in `messages.tts.providers["azure-speech"]`.

| Opzione                 | Descrizione                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Chiave della risorsa Azure Speech. In alternativa usa `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`. |
| `region`                | Area geografica della risorsa Azure Speech. In alternativa usa `AZURE_SPEECH_REGION` o `SPEECH_REGION`. |
| `endpoint`              | Sostituzione facoltativa dell'endpoint di Azure Speech. In alternativa usa `AZURE_SPEECH_ENDPOINT`.   |
| `baseUrl`               | Sostituzione facoltativa dell'URL di base di Azure Speech.                                            |
| `voice`                 | `ShortName` della voce Azure (valore predefinito: `en-US-JennyNeural`). Alias precedente: `voiceId`.  |
| `lang`                  | Codice lingua SSML (valore predefinito: `en-US`).                                                     |
| `outputFormat`          | Formato di output del file audio (valore predefinito: `audio-24khz-48kbitrate-mono-mp3`).             |
| `voiceNoteOutputFormat` | Formato di output del messaggio vocale (valore predefinito: `ogg-24khz-16bit-mono-opus`).             |
| `timeoutMs`             | Sostituzione del timeout della richiesta in millisecondi. In alternativa usa il valore globale `messages.tts.timeoutMs`. |

Il provider viene considerato configurato quando è impostato `apiKey` insieme a uno tra
`region`, `endpoint` e `baseUrl`. Le variabili d'ambiente vengono controllate solo come
ripiego per le chiavi di configurazione non impostate.

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    Azure Speech usa una chiave della risorsa Speech, non una chiave Azure OpenAI. La chiave
    viene inviata come `Ocp-Apim-Subscription-Key`; OpenClaw ricava
    `https://<region>.tts.speech.microsoft.com` da `region`, a meno che non venga
    fornito `endpoint` o `baseUrl`.
  </Accordion>
  <Accordion title="Nomi delle voci">
    Usa il valore `ShortName` della voce Azure Speech, ad esempio
    `en-US-JennyNeural`. Il provider incluso può elencare le voci tramite la
    stessa risorsa Speech ed esclude quelle contrassegnate come deprecate, ritirate
    o disabilitate.
  </Accordion>
  <Accordion title="Output audio">
    Azure accetta formati di output come `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` e `riff-24khz-16bit-mono-pcm`. OpenClaw
    richiede Ogg/Opus per le destinazioni `voice-note`, consentendo ai canali di inviare
    messaggi vocali nativi senza un'ulteriore conversione in MP3, e impone
    `raw-8khz-8bit-mono-mulaw` per le destinazioni di telefonia.
  </Accordion>
  <Accordion title="Alias">
    `azure` è accettato come alias del provider per le configurazioni esistenti, ma le nuove
    configurazioni dovrebbero usare `azure-speech` per evitare confusione con i provider
    di modelli Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="waveform-lines">
    Panoramica della sintesi vocale, provider e configurazione di `messages.tts`.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione, incluse le impostazioni di `messages.tts`.
  </Card>
  <Card title="Provider" href="/it/providers" icon="grid">
    Tutti i provider OpenClaw inclusi.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e procedure di debug.
  </Card>
</CardGroup>
