---
read_when:
    - Je wilt Inworld-spraaksynthese voor uitgaande antwoorden
    - Je hebt PCM-telefonie- of OGG_OPUS-spraaknotitie-uitvoer van Inworld nodig
summary: Inworld-streaming tekst-naar-spraak voor OpenClaw-antwoorden
title: Inworld
x-i18n:
    generated_at: "2026-07-12T09:18:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld is een provider voor streaming tekst-naar-spraak (TTS). In OpenClaw synthetiseert deze uitgaande antwoordaudio (standaard MP3, OGG_OPUS voor spraakberichten) en onbewerkte PCM-audio voor telefoniekanalen zoals Voice Call.

OpenClaw verstuurt aanvragen naar het streaming-TTS-eindpunt van Inworld, voegt de geretourneerde base64-audiofragmenten samen tot één buffer en geeft het resultaat door aan de standaardpijplijn voor antwoordaudio.

| Eigenschap          | Waarde                                                          |
| ------------------- | --------------------------------------------------------------- |
| Provider-id         | `inworld`                                                       |
| Plugin              | officieel extern pakket (`@openclaw/inworld-speech`)            |
| Contract            | `speechProviders` (alleen TTS)                                  |
| Omgevingsvariabele voor authenticatie | `INWORLD_API_KEY` (HTTP Basic, Base64-dashboardreferentie) |
| Basis-URL           | `https://api.inworld.ai`                                        |
| Standaardstem       | `Sarah`                                                         |
| Standaardmodel      | `inworld-tts-1.5-max`                                           |
| Uitvoer             | MP3 (standaard), OGG_OPUS (spraakberichten), PCM 22050 Hz (telefonie) |
| Website             | [inworld.ai](https://inworld.ai)                                |
| Documentatie        | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Plugin installeren

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Stel uw API-sleutel in">
    Kopieer de referentie uit uw Inworld-dashboard (Workspace > API Keys) en stel deze in als omgevingsvariabele. De waarde wordt ongewijzigd verzonden als de HTTP Basic-referentie. Codeer deze daarom niet opnieuw met Base64 en zet deze niet om in een bearertoken.

    ```bash
    INWORLD_API_KEY=<base64-referentie-uit-dashboard>
    ```

  </Step>
  <Step title="Selecteer Inworld in messages.tts">
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
  <Step title="Verstuur een bericht">
    Verstuur een antwoord via een verbonden kanaal. OpenClaw synthetiseert de audio met Inworld en levert deze als MP3 (of als OGG_OPUS wanneer het kanaal een spraakbericht verwacht).
  </Step>
</Steps>

## Configuratieopties

| Optie         | Pad                                          | Beschrijving                                                        |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64-dashboardreferentie. Valt terug op `INWORLD_API_KEY`.        |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Overschrijft de basis-URL van de Inworld-API (standaard `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Stem-id (standaard `Sarah`). Verouderde alias: `speakerVoiceId`.     |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS-model-id (standaard `inworld-tts-1.5-max`).                      |
| `temperature` | `messages.tts.providers.inworld.temperature` | Samplingtemperatuur, van `0` (exclusief) tot `2` (optioneel).        |

## Opmerkingen

<AccordionGroup>
  <Accordion title="Authenticatie">
    Inworld gebruikt HTTP Basic-authenticatie met één Base64-gecodeerde referentietekenreeks. Kopieer deze ongewijzigd uit het Inworld-dashboard. De provider verzendt deze als `Authorization: Basic <apiKey>` zonder verdere codering. Codeer de waarde daarom niet zelf met Base64 en geef geen token in bearerstijl door. Zie [opmerkingen over TTS-authenticatie](/nl/tools/tts#inworld-primary) voor dezelfde waarschuwing.
  </Accordion>
  <Accordion title="Modellen">
    Ondersteunde model-id's: `inworld-tts-1.5-max` (standaard), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audio-uitvoer">
    Antwoorden gebruiken standaard MP3. Wanneer het kanaaldoel `voice-note` is, vraagt OpenClaw Inworld om `OGG_OPUS`, zodat de audio als een native spraakballon wordt afgespeeld. Telefoniesynthese gebruikt onbewerkte `PCM` op 22050 Hz als invoer voor de telefoniebrug.
  </Accordion>
  <Accordion title="Aangepaste eindpunten">
    Overschrijf de API-host met `messages.tts.providers.inworld.baseUrl`. Schuine strepen aan het einde worden verwijderd voordat aanvragen worden verzonden.
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
    Alle ondersteunde OpenClaw-providers.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en stappen voor foutopsporing.
  </Card>
</CardGroup>
