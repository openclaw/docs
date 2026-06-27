---
read_when:
    - Je wilt Inworld-spraaksynthese voor uitgaande antwoorden
    - Je hebt PCM-telefonie of OGG_OPUS-spraaknotitie-uitvoer van Inworld nodig
summary: Inworld streaming tekst-naar-spraak voor OpenClaw-antwoorden
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:12:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld is een streaming tekst-naar-spraak-provider (TTS). In OpenClaw
synthetiseert het uitgaande antwoordaudio (standaard MP3, OGG_OPUS voor spraaknotities)
en PCM-audio voor telefoniekanalen zoals Voice Call.

OpenClaw post naar het streaming TTS-eindpunt van Inworld, voegt de
geretourneerde base64-audiofragmenten samen tot één buffer en geeft het resultaat door aan
de standaardpijplijn voor antwoordaudio.

| Eigenschap        | Waarde                                                          |
| ------------- | --------------------------------------------------------------- |
| Provider-id   | `inworld`                                                       |
| Plugin        | officieel extern pakket                                         |
| Contract      | `speechProviders` (alleen TTS)                                  |
| Auth-env-var  | `INWORLD_API_KEY` (HTTP Basic, Base64-dashboardreferentie)      |
| Basis-URL     | `https://api.inworld.ai`                                        |
| Standaardstem | `Sarah`                                                         |
| Standaardmodel | `inworld-tts-1.5-max`                                           |
| Uitvoer       | MP3 (standaard), OGG_OPUS (spraaknotities), PCM 22050 Hz (telefonie) |
| Website       | [inworld.ai](https://inworld.ai)                                |
| Documentatie  | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Stel je API-sleutel in">
    Kopieer de referentie uit je Inworld-dashboard (Workspace > API Keys)
    en stel deze in als env var. De waarde wordt letterlijk verzonden als de HTTP Basic-
    referentie, dus codeer deze niet opnieuw met Base64 en zet deze niet om naar een bearer-
    token.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
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
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verstuur een bericht">
    Verstuur een antwoord via een verbonden kanaal. OpenClaw synthetiseert de
    audio met Inworld en levert deze als MP3 (of OGG_OPUS wanneer het kanaal
    een spraaknotitie verwacht).
  </Step>
</Steps>

## Configuratieopties

| Optie            | Pad                                             | Beschrijving                                                     |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Base64-dashboardreferentie. Valt terug op `INWORLD_API_KEY`.     |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Overschrijf de basis-URL van de Inworld-API (standaard `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Stem-ID (standaard `Sarah`).                                     |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | TTS-model-id (standaard `inworld-tts-1.5-max`).                  |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Samplingtemperatuur `0..2` (optioneel).                          |

## Opmerkingen

<AccordionGroup>
  <Accordion title="Authenticatie">
    Inworld gebruikt HTTP Basic-authenticatie met één Base64-gecodeerde referentie-
    tekenreeks. Kopieer deze letterlijk uit het Inworld-dashboard. De provider verzendt
    deze als `Authorization: Basic <apiKey>` zonder verdere codering, dus
    codeer deze niet zelf met Base64 en geef geen bearer-achtig token door.
    Zie [TTS-authenticatieopmerkingen](/nl/tools/tts#inworld-primary) voor dezelfde toelichting.
  </Accordion>
  <Accordion title="Modellen">
    Ondersteunde model-id's: `inworld-tts-1.5-max` (standaard),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audio-uitvoer">
    Antwoorden gebruiken standaard MP3. Wanneer het kanaaldoel `voice-note` is,
    vraagt OpenClaw Inworld om `OGG_OPUS`, zodat de audio wordt afgespeeld als een native
    spraakballon. Telefoniesynthese gebruikt ruwe `PCM` op 22050 Hz om
    de telefoniebrug te voeden.
  </Accordion>
  <Accordion title="Aangepaste eindpunten">
    Overschrijf de API-host met `messages.tts.providers.inworld.baseUrl`.
    Afsluitende slashes worden verwijderd voordat aanvragen worden verzonden.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Tekst-naar-spraak" href="/nl/tools/tts" icon="waveform-lines">
    TTS-overzicht, providers en `messages.tts`-configuratie.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie inclusief `messages.tts`-instellingen.
  </Card>
  <Card title="Providers" href="/nl/providers" icon="grid">
    Alle ondersteunde OpenClaw-providers.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en stappen voor foutopsporing.
  </Card>
</CardGroup>
