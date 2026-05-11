---
read_when:
    - Je wilt Gradium voor tekst-naar-spraak
    - Je hebt een Gradium-API-sleutel, stem of configuratie voor directivetokens nodig
summary: Gradium-tekst-naar-spraak gebruiken in OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-05-11T20:46:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c79da6ec63532061a8112965a679f1113bbefcc91ee00def8153dd39b5b5e58
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) is een meegeleverde tekst-naar-spraakprovider voor OpenClaw. De plugin kan normale audioreacties (WAV), met spraaknotities compatibele Opus-uitvoer en 8 kHz u-law-audio voor telefonie-oppervlakken renderen.

| Eigenschap      | Waarde                                |
| ------------- | ------------------------------------ |
| Provider-id   | `gradium`                            |
| Auth          | `GRADIUM_API_KEY` of config `apiKey` |
| Basis-URL      | `https://api.gradium.ai` (standaard)   |
| Standaardstem | `Emma` (`YTpq7expH9539ERJ`)          |

## Instellen

Maak een Gradium API-sleutel aan en stel die vervolgens beschikbaar aan OpenClaw met een env-var of de config-sleutel.

<Tabs>
  <Tab title="Env-var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config-sleutel">
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

De plugin controleert eerst de opgeloste `apiKey` en valt terug op de omgevingsvariabele `GRADIUM_API_KEY`.

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Sleutel                                      | Type   | Beschrijving                                                                                   |
| ---------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`  | string | Opgeloste API-sleutel. Ondersteunt `${ENV}` en geheime refs.                                          |
| `messages.tts.providers.gradium.baseUrl` | string | Overschrijft de API-origin. Afsluitende slashes worden verwijderd. Standaard `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.voiceId` | string | Standaardstem-id dat wordt gebruikt wanneer er geen directive-overschrijving aanwezig is.                                  |

De uitvoeraudio-indeling wordt automatisch geselecteerd door de runtime op basis van het doeloppervlak en is niet configureerbaar vanuit `openclaw.json`. Zie [Uitvoer](#output) hieronder.

## Stemmen

| Naam      | Stem-ID           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Standaardstem: Emma.

### Stemoverschrijving per bericht

Wanneer het actieve spraakbeleid stemoverschrijvingen toestaat, kun je inline van stem wisselen met een directive-token. Al deze tokens worden opgelost naar dezelfde `voiceId`-overschrijving:

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Als het spraakbeleid stemoverschrijvingen uitschakelt, wordt de directive verbruikt maar genegeerd.

## Uitvoer

De runtime kiest de uitvoerindeling op basis van het doeloppervlak. De provider synthetiseert momenteel geen andere indelingen.

| Doel         | Indeling      | Bestandsextensie | Samplefrequentie | Spraakcompatibele vlag |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| Standaardaudio | `wav`       | `.wav`   | provider    | nee                    |
| Spraaknotitie     | `opus`      | `.opus`  | provider    | ja                   |
| Telefonie      | `ulaw_8000` | n.v.t.      | 8 kHz       | n.v.t.                   |

## Volgorde voor automatische selectie

Onder geconfigureerde TTS-providers is Gradiums volgorde voor automatische selectie `30`. Zie [Tekst-naar-spraak](/nl/tools/tts) voor hoe OpenClaw de actieve provider kiest wanneer `messages.tts.provider` niet is vastgezet.

## Gerelateerd

- [Tekst-naar-spraak](/nl/tools/tts)
- [Media-overzicht](/nl/tools/media-overview)
