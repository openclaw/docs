---
read_when:
    - Je wilt Mistral-modellen gebruiken in OpenClaw
    - Je wilt realtime transcriptie met Voxtral voor spraakoproepen
    - Je hebt onboarding voor de Mistral-API-sleutel en modelverwijzingen nodig
summary: Gebruik Mistral-modellen en Voxtral-transcriptie met OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T09:14:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

De gebundelde `mistral`-Plugin registreert vier contracten: chataanvullingen, mediabegrip (Voxtral-batchtranscriptie), realtime STT voor Voice Call (Voxtral Realtime) en geheugen-embeddings (`mistral-embed`).

| Eigenschap       | Waarde                                      |
| ---------------- | ------------------------------------------- |
| Provider-id      | `mistral`                                   |
| Plugin           | gebundeld, standaard ingeschakeld           |
| Auth-omgevingsvariabele | `MISTRAL_API_KEY`                    |
| Onboarding-vlag  | `--auth-choice mistral-api-key`             |
| Directe CLI-vlag | `--mistral-api-key <key>`                   |
| API              | OpenAI-compatibel (`openai-completions`)    |
| Basis-URL        | `https://api.mistral.ai/v1`                 |
| Standaardmodel   | `mistral/mistral-large-latest`              |
| Embeddingmodel   | `mistral-embed`                             |
| Voxtral-batch    | `voxtral-mini-latest` (audiotranscriptie)   |
| Voxtral-realtime | `voxtral-mini-transcribe-realtime-2602`     |

## Aan de slag

<Steps>
  <Step title="Haal je API-sleutel op">
    Maak een API-sleutel aan in de [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Voer de onboarding uit">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Of geef de sleutel rechtstreeks door:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Stel een standaardmodel in">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Ingebouwde LLM-catalogus

| Modelreferentie                  | Invoer      | Context | Maximale uitvoer | Opmerkingen                                            |
| -------------------------------- | ----------- | ------- | ---------------- | ----------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, afbeelding | 262,144 | 16,384     | Standaardmodel                                        |
| `mistral/mistral-medium-2508`    | tekst, afbeelding | 262,144 | 8,192      | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`     | tekst, afbeelding | 262,144 | 8,192      | Mistral Medium 3.5; instelbare redeneercapaciteit     |
| `mistral/mistral-small-latest`   | tekst, afbeelding | 262,144 | 16,384     | Nieuwste Mistral Small 4; instelbare `reasoning_effort` |
| `mistral/mistral-small-2603`     | tekst, afbeelding | 262,144 | 16,384     | Vastgezette Mistral Small 4; instelbare `reasoning_effort` |
| `mistral/pixtral-large-latest`   | tekst, afbeelding | 128,000 | 32,768     | Pixtral                                               |
| `mistral/codestral-latest`       | tekst       | 256,000 | 4,096      | Programmeren                                          |
| `mistral/devstral-medium-latest` | tekst       | 262,144 | 32,768     | Devstral 2                                            |
| `mistral/magistral-small`        | tekst       | 128,000 | 40,000     | Redeneren ingeschakeld                                |

Bekijk de betreffende rij in de gebundelde catalogus voordat je de configuratie wijzigt:

```bash
openclaw models list --all --provider mistral --plain
```

Voer een rooktest op een model uit zonder de Gateway te starten:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Audiotranscriptie (Voxtral)

Gebruik Voxtral voor batchgewijze audiotranscriptie via de pipeline voor mediabegrip:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Het pad voor mediatranscriptie gebruikt `/v1/audio/transcriptions`. Het standaardaudiomodel voor Mistral is `voxtral-mini-latest`.
</Tip>

## Streaming-STT voor Voice Call

De gebundelde `mistral`-Plugin registreert Voxtral Realtime als provider voor streaming-STT van Voice Call.

| Instelling      | Configuratiepad                                                        | Standaard                               |
| --------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| API-sleutel     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Valt terug op `MISTRAL_API_KEY`         |
| Model           | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codering        | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Bemonsteringsfrequentie | `...mistral.sampleRate`                                        | `8000`                                  |
| Doelvertraging  | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
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
OpenClaw gebruikt voor realtime STT van Mistral standaard `pcm_mulaw` op 8 kHz, zodat Voice Call Twilio-mediaframes rechtstreeks kan doorsturen. Gebruik `encoding: "pcm_s16le"` en een overeenkomende `sampleRate` alleen als je bovenliggende stream al uit onbewerkte PCM bestaat.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Instelbare redeneercapaciteit">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` en `mistral/mistral-medium-3-5` ondersteunen [instelbare redeneercapaciteit](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) in de Chat Completions-API via `reasoning_effort` (`none` minimaliseert extra denkwerk in de uitvoer; `high` toont volledige denksporen vóór het definitieve antwoord).

    OpenClaw koppelt het **denkniveau** van de sessie als volgt aan de API van Mistral:

    | OpenClaw-denkniveau                                               | Mistral `reasoning_effort` |
    | ----------------------------------------------------------------- | --------------------------- |
    | **uit** / **minimaal**                                            | `none`                      |
    | **laag** / **gemiddeld** / **hoog** / **xhoog** / **adaptief** / **maximaal** | `high`             |

    <Warning>
    Combineer de redeneermodus van Medium 3.5 niet met `temperature: 0`; er is gemeld dat de HTTP-API van Mistral `reasoning_effort="high"` in combinatie met `temperature: 0` afwijst met een 400-respons. Laat de temperatuur oningesteld of zet het denkniveau uit/minimaal, zodat OpenClaw `reasoning_effort: "none"` verzendt voordat je een lage temperatuur instelt.
    </Warning>

    Voorbeeld van modelspecifieke configuratie voor het redeneren van Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Andere gebundelde modellen in de Mistral-catalogus gebruiken deze parameter niet. Blijf `magistral-*`-modellen gebruiken wanneer je het systeemeigen, op redeneren gerichte gedrag van Mistral wilt.
    </Note>

  </Accordion>

  <Accordion title="Geheugen-embeddings">
    Mistral kan geheugen-embeddings leveren via `/v1/embeddings` (standaardmodel: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Authenticatie en basis-URL">
    - Mistral-authenticatie gebruikt `MISTRAL_API_KEY` (Bearer-header).
    - De basis-URL van de provider is standaard `https://api.mistral.ai/v1` en accepteert de standaard OpenAI-compatibele aanvraagstructuur voor chataanvullingen.
    - Het standaardmodel voor onboarding is `mistral/mistral-large-latest`.
    - Overschrijf de basis-URL onder `models.providers.mistral.baseUrl` alleen wanneer Mistral expliciet een regionaal eindpunt publiceert dat je nodig hebt.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Mediabegrip" href="/nl/nodes/media-understanding" icon="microphone">
    Audiotranscriptie instellen en een provider selecteren.
  </Card>
</CardGroup>
