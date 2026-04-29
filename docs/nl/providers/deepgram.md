---
read_when:
    - Je wilt Deepgram-spraak-naar-tekst gebruiken voor audiobijlagen
    - Je wilt Deepgram-streamingtranscriptie voor Spraakoproep
    - Je hebt een beknopt Deepgram-configuratievoorbeeld nodig
summary: Deepgram-transcriptie voor inkomende spraaknotities
title: Deepgram
x-i18n:
    generated_at: "2026-04-29T23:09:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram is een speech-to-text-API. In OpenClaw wordt deze gebruikt voor inkomende
audio-/spraaknotitie-transcriptie via `tools.media.audio` en voor streaming-STT
voor Voice Call via `plugins.entries.voice-call.config.streaming`.

Voor batchtranscriptie uploadt OpenClaw het volledige audiobestand naar Deepgram
en injecteert het transcript in de antwoordpipeline (`{{Transcript}}` +
`[Audio]`-blok). Voor Voice Call-streaming stuurt OpenClaw live G.711
u-law-frames door via Deepgrams WebSocket-`listen`-endpoint en geeft gedeeltelijke
of definitieve transcripties uit zodra Deepgram ze terugstuurt.

| Detail        | Waarde                                                     |
| ------------- | ---------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                       |
| Docs          | [developers.deepgram.com](https://developers.deepgram.com) |
| Auth          | `DEEPGRAM_API_KEY`                                         |
| Standaardmodel | `nova-3`                                                  |

## Aan de slag

<Steps>
  <Step title="Stel je API-sleutel in">
    Voeg je Deepgram-API-sleutel toe aan de omgeving:

    ```
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
  <Step title="Stuur een spraaknotitie">
    Stuur een audiobericht via een verbonden kanaal. OpenClaw transcribeert het
    via Deepgram en injecteert het transcript in de antwoordpipeline.
  </Step>
</Steps>

## Configuratieopties

| Optie             | Pad                                                          | Beschrijving                              |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram-model-id (standaard: `nova-3`)   |
| `language`        | `tools.media.audio.models[].language`                        | Taalhint (optioneel)                      |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Taaldetectie inschakelen (optioneel)      |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Interpunctie inschakelen (optioneel)      |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Slimme opmaak inschakelen (optioneel)     |

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

## Voice Call-streaming-STT

De gebundelde `deepgram`-plugin registreert ook een realtime transcriptieprovider
voor de Voice Call-plugin.

| Instelling          | Configuratiepad                                                        | Standaard                         |
| ------------------- | ---------------------------------------------------------------------- | --------------------------------- |
| API-sleutel         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Valt terug op `DEEPGRAM_API_KEY`  |
| Model               | `...deepgram.model`                                                    | `nova-3`                          |
| Taal                | `...deepgram.language`                                                 | (niet ingesteld)                  |
| Codering            | `...deepgram.encoding`                                                 | `mulaw`                           |
| Samplefrequentie    | `...deepgram.sampleRate`                                               | `8000`                            |
| Endpointing         | `...deepgram.endpointingMs`                                            | `800`                             |
| Tussenresultaten    | `...deepgram.interimResults`                                           | `true`                            |

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
Voice Call ontvangt telefonie-audio als 8 kHz G.711 u-law. De Deepgram-
streamingprovider gebruikt standaard `encoding: "mulaw"` en `sampleRate: 8000`, zodat
Twilio-mediaframes rechtstreeks kunnen worden doorgestuurd.
</Note>

## Opmerkingen

<AccordionGroup>
  <Accordion title="Authenticatie">
    Authenticatie volgt de standaardvolgorde voor provider-authenticatie. `DEEPGRAM_API_KEY` is
    de eenvoudigste route.
  </Accordion>
  <Accordion title="Proxy en aangepaste endpoints">
    Overschrijf endpoints of headers met `tools.media.audio.baseUrl` en
    `tools.media.audio.headers` wanneer je een proxy gebruikt.
  </Accordion>
  <Accordion title="Uitvoergedrag">
    Uitvoer volgt dezelfde audioregels als andere providers (groottelimieten, time-outs,
    transcriptinjectie).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Mediatools" href="/nl/tools/media-overview" icon="photo-film">
    Overzicht van de verwerkingspipeline voor audio, afbeeldingen en video.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie inclusief instellingen voor mediatools.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en stappen voor foutopsporing.
  </Card>
  <Card title="FAQ" href="/nl/help/faq" icon="circle-question">
    Veelgestelde vragen over het instellen van OpenClaw.
  </Card>
</CardGroup>
