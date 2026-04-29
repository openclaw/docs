---
read_when:
    - Je wilt Azure Speech-spraaksynthese voor uitgaande antwoorden
    - Je hebt native Ogg Opus-uitvoer voor spraaknotities van Azure Speech nodig
summary: Azure AI Speech-tekst-naar-spraak voor OpenClaw-antwoorden
title: Azure Speech
x-i18n:
    generated_at: "2026-04-29T23:08:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech is een Azure AI Speech-provider voor tekst-naar-spraak. In OpenClaw
synthetiseert het standaard uitgaande antwoordaudio als MP3, native Ogg/Opus
voor spraaknotities, en 8 kHz mulaw-audio voor telefoniekanalen zoals Voice Call.

OpenClaw gebruikt de Azure Speech REST API rechtstreeks met SSML en verzendt de
uitvoerindeling die eigendom is van de provider via `X-Microsoft-OutputFormat`.

| Detail                  | Waarde                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Website                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Docs                    | [Speech REST tekst-naar-spraak](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Auth                    | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Default voice           | `en-US-JennyNeural`                                                                                            |
| Default file output     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Default voice-note file | `ogg-24khz-16bit-mono-opus`                                                                                    |

## Aan de slag

<Steps>
  <Step title="Create an Azure Speech resource">
    Maak in de Azure-portal een Speech-resource. Kopieer **KEY 1** uit
    Resource Management > Keys and Endpoint, en kopieer de resourcelocatie,
    zoals `eastus`.

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
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    Verzend een antwoord via een willekeurig verbonden kanaal. OpenClaw
    synthetiseert de audio met Azure Speech en levert MP3 voor standaardaudio,
    of Ogg/Opus wanneer het kanaal een spraaknotitie verwacht.
  </Step>
</Steps>

## Configuratieopties

| Optie                   | Pad                                                         | Beschrijving                                                                                         |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Azure Speech-resourcesleutel. Valt terug op `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` of `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Azure Speech-resourceregio. Valt terug op `AZURE_SPEECH_REGION` of `SPEECH_REGION`.                   |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Optionele override voor Azure Speech-eindpunt/basis-URL.                                              |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Optionele override voor Azure Speech-basis-URL.                                                       |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | Azure-spraakstem ShortName (standaard `en-US-JennyNeural`).                                           |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML-taalcode (standaard `en-US`).                                                                    |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Uitvoerindeling voor audiobestanden (standaard `audio-24khz-48kbitrate-mono-mp3`).                    |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Uitvoerindeling voor spraaknotities (standaard `ogg-24khz-16bit-mono-opus`).                          |

## Notities

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech gebruikt een Speech-resourcesleutel, geen Azure OpenAI-sleutel.
    De sleutel wordt verzonden als `Ocp-Apim-Subscription-Key`; OpenClaw leidt
    `https://<region>.tts.speech.microsoft.com` af uit `region`, tenzij je
    `endpoint` of `baseUrl` opgeeft.
  </Accordion>
  <Accordion title="Voice names">
    Gebruik de Azure Speech-spraakwaarde `ShortName`, bijvoorbeeld
    `en-US-JennyNeural`. De gebundelde provider kan stemmen weergeven via
    dezelfde Speech-resource en filtert stemmen die als verouderd of uitgefaseerd
    zijn gemarkeerd.
  </Accordion>
  <Accordion title="Audio outputs">
    Azure accepteert uitvoerindelingen zoals `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` en `riff-24khz-16bit-mono-pcm`. OpenClaw
    vraagt Ogg/Opus aan voor `voice-note`-doelen, zodat kanalen native
    spraakballonnen kunnen verzenden zonder extra MP3-conversie.
  </Accordion>
  <Accordion title="Alias">
    `azure` wordt geaccepteerd als provideralias voor bestaande PR's en
    gebruikersconfiguratie, maar nieuwe configuratie moet `azure-speech`
    gebruiken om verwarring met Azure OpenAI-modelproviders te voorkomen.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/nl/tools/tts" icon="waveform-lines">
    Overzicht van TTS, providers en `messages.tts`-configuratie.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie inclusief `messages.tts`-instellingen.
  </Card>
  <Card title="Providers" href="/nl/providers" icon="grid">
    Alle gebundelde OpenClaw-providers.
  </Card>
  <Card title="Troubleshooting" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en foutopsporingsstappen.
  </Card>
</CardGroup>
