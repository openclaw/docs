---
read_when:
    - Je wilt Inworld-spraaksynthese voor uitgaande antwoorden
    - Je hebt PCM-telefonie of uitvoer als OGG_OPUS-spraaknotitie van Inworld nodig
summary: Streaming tekst-naar-spraak van Inworld voor OpenClaw-antwoorden
title: Inworld
x-i18n:
    generated_at: "2026-04-29T23:10:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 16
---

Inworld is een provider voor streaming tekst-naar-spraak (TTS). In OpenClaw
synthetiseert het uitgaande antwoordaudio (standaard MP3, OGG_OPUS voor spraaknotities)
en PCM-audio voor telefoniekanalen zoals Spraakoproep.

OpenClaw post naar het streaming TTS-eindpunt van Inworld, voegt de
geretourneerde base64-audiochunks samen tot één buffer en geeft het resultaat door aan
de standaardpipeline voor antwoordaudio.

| Detail        | Waarde                                                      |
| ------------- | ----------------------------------------------------------- |
| Website       | [inworld.ai](https://inworld.ai)                            |
| Documentatie  | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Auth          | `INWORLD_API_KEY` (HTTP Basic, Base64-dashboardreferentie) |
| Standaardstem | `Sarah`                                                     |
| Standaardmodel | `inworld-tts-1.5-max`                                      |

## Aan de slag

<Steps>
  <Step title="Set your API key">
    Kopieer de referentie uit je Inworld-dashboard (Workspace > API Keys)
    en stel die in als omgevingsvariabele. De waarde wordt letterlijk verzonden als de HTTP Basic-
    referentie, dus codeer deze niet opnieuw met Base64 en zet deze niet om naar een bearer-
    token.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Select Inworld in messages.tts">
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
  <Step title="Send a message">
    Stuur een antwoord via een verbonden kanaal. OpenClaw synthetiseert de
    audio met Inworld en levert die als MP3 (of OGG_OPUS wanneer het kanaal
    een spraaknotitie verwacht).
  </Step>
</Steps>

## Configuratieopties

| Optie         | Pad                                          | Beschrijving                                                     |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64-dashboardreferentie. Valt terug op `INWORLD_API_KEY`.     |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Overschrijf de basis-URL van de Inworld-API (standaard `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Stem-ID (standaard `Sarah`).                                     |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS-model-ID (standaard `inworld-tts-1.5-max`).                  |
| `temperature` | `messages.tts.providers.inworld.temperature` | Samplingtemperatuur `0..2` (optioneel).                          |

## Opmerkingen

<AccordionGroup>
  <Accordion title="Authentication">
    Inworld gebruikt HTTP Basic-authenticatie met één Base64-gecodeerde referentie-
    tekenreeks. Kopieer deze letterlijk uit het Inworld-dashboard. De provider verzendt
    deze als `Authorization: Basic <apiKey>` zonder verdere codering, dus
    codeer deze niet zelf met Base64 en geef geen token in bearer-stijl door.
    Zie [TTS-authenticatieopmerkingen](/nl/tools/tts#inworld-primary) voor dezelfde toelichting.
  </Accordion>
  <Accordion title="Models">
    Ondersteunde model-ID's: `inworld-tts-1.5-max` (standaard),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audio outputs">
    Antwoorden gebruiken standaard MP3. Wanneer het kanaaldoel `voice-note` is,
    vraagt OpenClaw Inworld om `OGG_OPUS`, zodat de audio wordt afgespeeld als een native
    spraakballon. Telefoniesynthese gebruikt onbewerkte `PCM` op 22050 Hz om
    de telefoniebridge te voeden.
  </Accordion>
  <Accordion title="Custom endpoints">
    Overschrijf de API-host met `messages.tts.providers.inworld.baseUrl`.
    Afsluitende slashes worden verwijderd voordat verzoeken worden verzonden.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/nl/tools/tts" icon="waveform-lines">
    TTS-overzicht, providers en `messages.tts`-configuratie.
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
