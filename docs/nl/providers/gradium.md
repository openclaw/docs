---
read_when:
    - Je wilt Gradium voor tekst-naar-spraak
    - Je hebt een Gradium-API-sleutel, stem- of directivetokenconfiguratie nodig
summary: Gradium-tekst-naar-spraak gebruiken in OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-16T16:14:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) is een tekst-naar-spraakprovider voor OpenClaw. Deze genereert standaard audioreacties (WAV), met spraaknotities compatibele Opus-uitvoer en 8 kHz u-law-audio voor telefoniekanalen.

| Eigenschap     | Waarde                               |
| -------------- | ------------------------------------ |
| Provider-id    | `gradium`                            |
| Authenticatie  | `GRADIUM_API_KEY` of configuratie `apiKey` |
| Basis-URL      | `https://api.gradium.ai` (standaard)   |
| Standaardstem  | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin installeren

Gradium is een officiële externe plugin. Installeer deze en start daarna de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Instellen

Maak een Gradium-API-sleutel en stel deze vervolgens beschikbaar via een omgevingsvariabele of de configuratiesleutel. De configuratie heeft voorrang op de omgevingsvariabele.

<Tabs>
  <Tab title="Omgevingsvariabele">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Configuratiesleutel">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Configuratie

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Sleutel                                         | Type   | Beschrijving                                                                                           |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| `messages.tts.providers.gradium.apiKey`         | tekenreeks | Omgezette API-sleutel. Ondersteunt `${ENV}` en geheime verwijzingen.                                  |
| `messages.tts.providers.gradium.baseUrl`        | tekenreeks | HTTPS-URL van de Gradium-API op `api.gradium.ai`. Schuine strepen aan het einde worden verwijderd. Standaard `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | tekenreeks | Standaardstem-id dat wordt gebruikt wanneer er geen overschrijvende instructie aanwezig is.                   |

De uitvoerindeling wordt automatisch gekozen op basis van het doelkanaal (zie [Uitvoer](#output)) en kan niet worden geconfigureerd in `openclaw.json`.

## Stemmen

| Naam               | Stem-id            |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(standaard)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### Stem per bericht overschrijven

Wanneer het actieve spraakbeleid het overschrijven van stemmen toestaat, kun je binnen de tekst van stem wisselen met een instructietoken (deze zijn allemaal gelijkwaardig en accepteren allemaal een provider-eigen stem-id):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Als het spraakbeleid het overschrijven van stemmen uitschakelt, wordt de instructie verwerkt maar genegeerd.

## Uitvoer

De uitvoerindeling wordt geselecteerd op basis van het doelkanaal; de provider genereert geen andere indelingen.

| Doel           | Indeling    | Bestandsextensie | Samplefrequentie | Spraakcompatibele vlag |
| -------------- | ----------- | ---------------- | ---------------- | ---------------------- |
| Standaardaudio | `wav`       | `.wav`   | provider         | nee                    |
| Spraaknotitie  | `opus`      | `.opus`  | provider         | ja                     |
| Telefonie      | `ulaw_8000` | n.v.t.           | 8 kHz            | n.v.t.                 |

## Volgorde voor automatische selectie

Onder de geconfigureerde TTS-providers is de volgorde van Gradium voor automatische selectie `30`. Zie [Tekst-naar-spraak](/nl/tools/tts) voor hoe OpenClaw de actieve provider kiest wanneer `messages.tts.provider` niet is vastgezet.

## Gerelateerd

- [Tekst-naar-spraak](/nl/tools/tts)
- [Mediaoverzicht](/nl/tools/media-overview)
