---
read_when:
    - Je wilt Gradium voor tekst-naar-spraak
    - Je hebt configuratie voor een Gradium API-sleutel, stem of directivetoken nodig
summary: Gebruik Gradium-tekst-naar-spraak in OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:12:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) is een tekst-naar-spraak-provider voor OpenClaw. De Plugin kan normale audioreacties (WAV), Opus-uitvoer die compatibel is met spraaknotities, en 8 kHz u-law-audio voor telefonie-oppervlakken renderen.

| Eigenschap       | Waarde                               |
| ---------------- | ------------------------------------ |
| Provider-id      | `gradium`                            |
| Authenticatie    | `GRADIUM_API_KEY` of config `apiKey` |
| Basis-URL        | `https://api.gradium.ai` (standaard) |
| Standaardstem    | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin installeren

Installeer de officiële Plugin en start daarna Gateway opnieuw:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Instellen

Maak een Gradium-API-sleutel en stel die daarna beschikbaar aan OpenClaw via een omgevingsvariabele of de configuratiesleutel.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
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

De Plugin controleert eerst de opgeloste `apiKey` en valt terug op de omgevingsvariabele `GRADIUM_API_KEY`.

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

| Sleutel                                         | Type   | Beschrijving                                                                                              |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Opgeloste API-sleutel. Ondersteunt `${ENV}` en secret refs.                                               |
| `messages.tts.providers.gradium.baseUrl`        | string | Overschrijft de API-origin. Afsluitende slashes worden verwijderd. Standaard `https://api.gradium.ai`.   |
| `messages.tts.providers.gradium.speakerVoiceId` | string | Standaardstem-id dat wordt gebruikt wanneer er geen directive-overschrijving aanwezig is.                |

De uitvoeraudio-indeling wordt automatisch geselecteerd door de runtime op basis van het doeloppervlak en is niet configureerbaar vanuit `openclaw.json`. Zie [Uitvoer](#output) hieronder.

## Stemmen

| Naam      | Stem-ID            |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Standaardstem: Emma.

### Stem per bericht overschrijven

Wanneer het actieve spraakbeleid stemoverschrijvingen toestaat, kun je inline van stem wisselen met een directive-token. Gebruik `speakerVoiceId` voor provider-native stem-id's.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Als het spraakbeleid stemoverschrijvingen uitschakelt, wordt de directive verwerkt maar genegeerd.

## Uitvoer

De runtime kiest de uitvoerindeling op basis van het doeloppervlak. De provider synthetiseert momenteel geen andere indelingen.

| Doel             | Indeling    | Bestandsextensie | Samplefrequentie | Spraakcompatibele vlag |
| ---------------- | ----------- | ---------------- | ---------------- | ---------------------- |
| Standaardaudio   | `wav`       | `.wav`           | provider         | nee                    |
| Spraaknotitie    | `opus`      | `.opus`          | provider         | ja                     |
| Telefonie        | `ulaw_8000` | n.v.t.           | 8 kHz            | n.v.t.                 |

## Volgorde voor automatische selectie

Van de geconfigureerde TTS-providers is de automatische selectievolgorde van Gradium `30`. Zie [Tekst-naar-spraak](/nl/tools/tts) voor hoe OpenClaw de actieve provider kiest wanneer `messages.tts.provider` niet is vastgezet.

## Gerelateerd

- [Tekst-naar-spraak](/nl/tools/tts)
- [Media-overzicht](/nl/tools/media-overview)
