---
read_when:
    - U wilt Azure-spraaksynthese voor uitgaande antwoorden
    - Je hebt native Ogg Opus-uitvoer voor spraaknotities van Azure Speech nodig
summary: Azure AI Speech-tekst-naar-spraak voor OpenClaw-antwoorden
title: Azure-spraak
x-i18n:
    generated_at: "2026-07-12T09:12:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech is een meegeleverde tekst-naar-spraakprovider van Azure AI Speech. OpenClaw
roept de Azure Speech REST API rechtstreeks aan met SSML en synthetiseert MP3 voor
standaardantwoorden, native Ogg/Opus voor spraakberichten en 8 kHz mulaw voor
telefoniekanalen zoals Voice Call. De aanvraag verzendt de door de provider beheerde
uitvoerindeling via de header `X-Microsoft-OutputFormat`.

| Detail                  | Waarde                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Provider-ID             | `azure-speech` (alias: `azure`)                                                                                |
| Website                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentatie            | [Speech REST tekst-naar-spraak](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Authenticatie           | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Standaardstem           | `en-US-JennyNeural`                                                                                            |
| Standaardbestandsuitvoer | `audio-24khz-48kbitrate-mono-mp3`                                                                             |
| Standaardbestand voor spraakberichten | `ogg-24khz-16bit-mono-opus`                                                                      |

## Aan de slag

<Steps>
  <Step title="Een Azure Speech-resource maken">
    Maak in de Azure-portal een Speech-resource. Kopieer **KEY 1** uit
    Resource Management > Keys and Endpoint en kopieer de resourcelocatie,
    zoals `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Azure Speech selecteren in messages.tts">
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
  <Step title="Een bericht verzenden">
    Verzend een antwoord via een verbonden kanaal. OpenClaw synthetiseert de audio
    met Azure Speech en levert MP3 voor standaardaudio of Ogg/Opus wanneer
    het kanaal een spraakbericht verwacht.
  </Step>
</Steps>

## Configuratieopties

Alle opties staan onder `messages.tts.providers["azure-speech"]`.

| Optie                   | Beschrijving                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Azure Speech-resourcesleutel. Valt terug op `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` of `SPEECH_KEY`. |
| `region`                | Regio van de Azure Speech-resource. Valt terug op `AZURE_SPEECH_REGION` of `SPEECH_REGION`.           |
| `endpoint`              | Optionele overschrijving van het Azure Speech-eindpunt. Valt terug op `AZURE_SPEECH_ENDPOINT`.        |
| `baseUrl`               | Optionele overschrijving van de Azure Speech-basis-URL.                                               |
| `voice`                 | Azure-stemwaarde `ShortName` (standaard `en-US-JennyNeural`). Verouderde alias: `voiceId`.            |
| `lang`                  | SSML-taalcode (standaard `en-US`).                                                                    |
| `outputFormat`          | Uitvoerindeling voor audiobestanden (standaard `audio-24khz-48kbitrate-mono-mp3`).                    |
| `voiceNoteOutputFormat` | Uitvoerindeling voor spraakberichten (standaard `ogg-24khz-16bit-mono-opus`).                          |
| `timeoutMs`             | Overschrijving van de aanvraagtijdslimiet in milliseconden. Valt terug op de algemene `messages.tts.timeoutMs`. |

De provider wordt als geconfigureerd beschouwd zodra `apiKey` is ingesteld, samen met
`region`, `endpoint` of `baseUrl`. Omgevingsvariabelen worden alleen als terugvaloptie
gecontroleerd voor niet-ingestelde configuratiesleutels.

## Opmerkingen

<AccordionGroup>
  <Accordion title="Authenticatie">
    Azure Speech gebruikt een Speech-resourcesleutel, geen Azure OpenAI-sleutel. De sleutel
    wordt verzonden als `Ocp-Apim-Subscription-Key`; OpenClaw leidt
    `https://<region>.tts.speech.microsoft.com` af uit `region`, tenzij u
    `endpoint` of `baseUrl` opgeeft.
  </Accordion>
  <Accordion title="Stemnamen">
    Gebruik de `ShortName`-waarde van de Azure Speech-stem, bijvoorbeeld
    `en-US-JennyNeural`. De meegeleverde provider kan via dezelfde
    Speech-resource stemmen weergeven en filtert stemmen uit die als verouderd,
    buiten gebruik of uitgeschakeld zijn gemarkeerd.
  </Accordion>
  <Accordion title="Audio-uitvoer">
    Azure accepteert uitvoerindelingen zoals `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` en `riff-24khz-16bit-mono-pcm`. OpenClaw
    vraagt Ogg/Opus aan voor `voice-note`-doelen, zodat kanalen native
    spraakballonnen kunnen verzenden zonder extra MP3-conversie, en dwingt
    `raw-8khz-8bit-mono-mulaw` af voor telefoniedoelen.
  </Accordion>
  <Accordion title="Alias">
    `azure` wordt geaccepteerd als provideralias voor bestaande configuratie, maar nieuwe
    configuratie moet `azure-speech` gebruiken om verwarring met Azure OpenAI-
    modelproviders te voorkomen.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Tekst-naar-spraak" href="/nl/tools/tts" icon="waveform-lines">
    Overzicht van TTS, providers en de configuratie van `messages.tts`.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie, inclusief instellingen voor `messages.tts`.
  </Card>
  <Card title="Providers" href="/nl/providers" icon="grid">
    Alle meegeleverde OpenClaw-providers.
  </Card>
  <Card title="Problemen oplossen" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en stappen voor foutopsporing.
  </Card>
</CardGroup>
