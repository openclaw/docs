---
read_when:
    - Je wilt spraak-naar-tekst van Deepgram voor audiobijlagen
    - Je wilt streamingtranscriptie van Deepgram voor Voice Call
    - Je hebt een snel Deepgram-configuratievoorbeeld nodig
summary: Deepgram-transcriptie voor inkomende spraakberichten
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T16:21:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram is een spraak-naar-tekst-API. OpenClaw gebruikt deze voor de transcriptie
van inkomende audio en spraaknotities via `tools.media.audio` en voor streaming-STT
van Voice Call via `plugins.entries.voice-call.config.streaming`.

Bij batchtranscriptie wordt het volledige audiobestand naar Deepgram geüpload en wordt
het transcript in de antwoordpipeline ingevoegd (`{{Transcript}}` + `[Audio]`-blok).
Voice Call-streaming stuurt live G.711-u-law-frames door via Deepgrams
WebSocket-`listen`-endpoint en geeft gedeeltelijke en definitieve transcripten uit zodra Deepgram
deze retourneert.

| Detail        | Waarde                                                     |
| ------------- | ---------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                       |
| Documentatie  | [developers.deepgram.com](https://developers.deepgram.com) |
| Authenticatie | `DEEPGRAM_API_KEY`                                         |
| Standaardmodel | `nova-3`                                                   |

## Aan de slag

<Steps>
  <Step title="Stel je API-sleutel in">
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
  <Step title="Stuur een spraaknotitie">
    Stuur een audiobericht via een verbonden kanaal. OpenClaw transcribeert het
    via Deepgram en voegt het transcript in de antwoordpipeline in.
  </Step>
</Steps>

## Configuratieopties

| Optie      | Pad                                   | Beschrijving                          |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram-model-id (standaard: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Taalhint (optioneel)                  |

`providerOptions.deepgram` voegt extra queryparameters rechtstreeks samen met de
Deepgram-`/listen`-aanvraag, zodat elke door Deepgram ondersteunde parameternaam werkt
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

## Streaming-STT van Voice Call

De meegeleverde `deepgram`-plugin registreert ook een provider voor realtime transcriptie
voor de Voice Call-plugin.

| Instelling      | Configuratiepad                                                         | Standaard                                    |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| API-sleutel     | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Valt terug op `DEEPGRAM_API_KEY`             |
| Basis-URL       | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` of de openbare API van Deepgram |
| Model           | `...deepgram.model`                                                     | `nova-3`                                     |
| Taal            | `...deepgram.language`                                                  | (niet ingesteld)                             |
| Codering        | `...deepgram.encoding`                                                  | `mulaw`                                      |
| Samplefrequentie | `...deepgram.sampleRate`                                                | `8000`                                       |
| Eindpuntdetectie | `...deepgram.endpointingMs`                                             | `800`                                        |
| Tussentijdse resultaten | `...deepgram.interimResults`                                            | `true`                                       |

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

Stel voor een [aangepast Deepgram-eindpunt](https://developers.deepgram.com/reference/custom-endpoints)
`baseUrl` in op de hoofd-URL van het eindpunt, inclusief een eventueel basispad maar zonder `/listen`.
Realtime-eindpunten accepteren `http://`, `https://`, `ws://` en `wss://`. HTTP
wordt aan WS gekoppeld, HTTPS aan WSS en expliciete WebSocket-schema's blijven ongewijzigd.
Ongeldige URL's en andere schema's veroorzaken een fout tijdens het instellen van de sessie.

<Note>
Voice Call ontvangt telefonieaudio als 8 kHz G.711 u-law. De streamingprovider
van Deepgram gebruikt standaard `encoding: "mulaw"` en `sampleRate: 8000`, zodat
Twilio-mediaframes rechtstreeks kunnen worden doorgestuurd.
</Note>

## Opmerkingen

<AccordionGroup>
  <Accordion title="Authenticatie">
    Authenticatie volgt de standaardvolgorde voor providerauthenticatie. `DEEPGRAM_API_KEY` is
    de eenvoudigste methode.
  </Accordion>
  <Accordion title="Proxy en aangepaste eindpunten">
    Overschrijf eindpunten of headers met `tools.media.audio.baseUrl` en
    `tools.media.audio.headers` wanneer je een proxy gebruikt.
  </Accordion>
  <Accordion title="Uitvoergedrag">
    De uitvoer volgt dezelfde audioregels als andere providers (groottelimieten, time-outs
    en transcriptinvoeging).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Mediatools" href="/nl/tools/media-overview" icon="photo-film">
    Overzicht van de verwerkingspipeline voor audio, afbeeldingen en video.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie, inclusief instellingen voor mediatools.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en stappen voor foutopsporing.
  </Card>
  <Card title="Veelgestelde vragen" href="/nl/help/faq" icon="circle-question">
    Veelgestelde vragen over het instellen van OpenClaw.
  </Card>
</CardGroup>
