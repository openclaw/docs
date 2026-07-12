---
read_when:
    - Je wilt spraak-naar-tekst van Deepgram voor audiobijlagen
    - Je wilt streamingtranscriptie van Deepgram voor Voice Call
    - Je hebt een snel Deepgram-configuratievoorbeeld nodig
summary: Deepgram-transcriptie voor inkomende spraaknotities
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T09:18:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram is een spraak-naar-tekst-API. OpenClaw gebruikt deze voor de transcriptie
van inkomende audio en spraakberichten via `tools.media.audio` en voor streaming-STT
van Voice Call via `plugins.entries.voice-call.config.streaming`.

Bij batchtranscriptie wordt het volledige audiobestand naar Deepgram geüpload en
wordt het transcript in de antwoordpijplijn ingevoegd (`{{Transcript}}` + `[Audio]`-blok).
Bij streaming van Voice Call worden live G.711-u-law-frames via Deepgrams
WebSocket-`listen`-eindpunt doorgestuurd en worden gedeeltelijke/definitieve transcripten
uitgestuurd zodra Deepgram deze retourneert.

| Detail          | Waarde                                                     |
| --------------- | ---------------------------------------------------------- |
| Website         | [deepgram.com](https://deepgram.com)                       |
| Documentatie    | [developers.deepgram.com](https://developers.deepgram.com) |
| Authenticatie   | `DEEPGRAM_API_KEY`                                         |
| Standaardmodel  | `nova-3`                                                   |

## Aan de slag

<Steps>
  <Step title="Stel uw API-sleutel in">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Schakel de audioprovider in">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Stuur een spraakbericht">
    Stuur een audiobericht via een verbonden kanaal. OpenClaw transcribeert het
    via Deepgram en voegt het transcript in de antwoordpijplijn in.
  </Step>
</Steps>

## Configuratieopties

| Optie      | Pad                                   | Beschrijving                               |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | Deepgram-model-ID (standaard: `nova-3`)    |
| `language` | `tools.media.audio.models[].language` | Taalhint (optioneel)                       |

`providerOptions.deepgram` voegt extra queryparameters rechtstreeks samen met het
Deepgram-`/listen`-verzoek, zodat elke door Deepgram ondersteunde parameternaam werkt
(bijvoorbeeld `detect_language`, `punctuate`, `smart_format`):

<Tabs>
  <Tab title="Met taalhint">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Met Deepgram-opties">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Streaming-STT voor Voice Call

De meegeleverde `deepgram`-plugin registreert ook een provider voor realtime
transcriptie voor de Voice Call-plugin.

| Instelling          | Configuratiepad                                                          | Standaard                              |
| ------------------- | ------------------------------------------------------------------------ | -------------------------------------- |
| API-sleutel         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey`  | Valt terug op `DEEPGRAM_API_KEY`       |
| Model               | `...deepgram.model`                                                      | `nova-3`                               |
| Taal                | `...deepgram.language`                                                   | (niet ingesteld)                       |
| Codering            | `...deepgram.encoding`                                                   | `mulaw`                                |
| Bemonsteringsfrequentie | `...deepgram.sampleRate`                                             | `8000`                                 |
| Eindpuntdetectie    | `...deepgram.endpointingMs`                                              | `800`                                  |
| Tussentijdse resultaten | `...deepgram.interimResults`                                         | `true`                                 |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call ontvangt telefonieaudio als 8 kHz G.711 u-law. De streamingprovider
van Deepgram gebruikt standaard `encoding: "mulaw"` en `sampleRate: 8000`, zodat
Twilio-mediaframes rechtstreeks kunnen worden doorgestuurd.
</Note>

## Opmerkingen

<AccordionGroup>
  <Accordion title="Authenticatie">
    Authenticatie volgt de standaardvolgorde voor providerauthenticatie.
    `DEEPGRAM_API_KEY` is de eenvoudigste optie.
  </Accordion>
  <Accordion title="Proxy en aangepaste eindpunten">
    Overschrijf eindpunten of headers met `tools.media.audio.baseUrl` en
    `tools.media.audio.headers` wanneer u een proxy gebruikt.
  </Accordion>
  <Accordion title="Uitvoergedrag">
    De uitvoer volgt dezelfde audioregels als bij andere providers
    (groottelimieten, time-outs, invoeging van transcripten).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Mediatools" href="/nl/tools/media-overview" icon="photo-film">
    Overzicht van de verwerkingspijplijn voor audio, afbeeldingen en video.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie, inclusief instellingen voor mediatools.
  </Card>
  <Card title="Problemen oplossen" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en stappen voor foutopsporing.
  </Card>
  <Card title="Veelgestelde vragen" href="/nl/help/faq" icon="circle-question">
    Veelgestelde vragen over het instellen van OpenClaw.
  </Card>
</CardGroup>
