---
read_when:
    - Je wilt Mistral-modellen gebruiken in OpenClaw
    - Je wilt realtime-transcriptie met Voxtral voor Spraakoproep
    - Je hebt onboarding voor Mistral API-sleutels en modelreferenties nodig
summary: Mistral-modellen en Voxtral-transcriptie gebruiken met OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-11T20:47:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw bevat een gebundelde Mistral-Plugin die vier contracten registreert: chataanvullingen, mediabegrip (Voxtral-batchtranscriptie), realtime STT voor Voice Call (Voxtral Realtime) en geheugenembeddings (`mistral-embed`).

| Eigenschap       | Waarde                                      |
| ---------------- | ------------------------------------------- |
| Provider-id      | `mistral`                                   |
| Plugin           | gebundeld, `enabledByDefault: true`         |
| Auth-env-var     | `MISTRAL_API_KEY`                           |
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
  <Step title="Voer onboarding uit">
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

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
is het huidige gecombineerde Medium-model in de gebundelde catalogus: 128B dense gewichten,
tekst- en beeldinvoer, 256K context, functieaanroepen, gestructureerde uitvoer, coderen
en instelbare reasoning via de Chat Completions API. Gebruik
`mistral/mistral-medium-3-5` wanneer je Mistrals nieuwere uniforme
agentic/coding-model wilt in plaats van de standaard `mistral/mistral-large-latest`.

OpenClaw levert momenteel deze gebundelde Mistral-catalogus:

| Model-ref                        | Invoer      | Context | Max. uitvoer | Opmerkingen                                                     |
| -------------------------------- | ----------- | ------- | ------------ | --------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, beeld | 262,144 | 16,384       | Standaardmodel                                                  |
| `mistral/mistral-medium-2508`    | tekst, beeld | 262,144 | 8,192        | Mistral Medium 3.1                                              |
| `mistral/mistral-medium-3-5`     | tekst, beeld | 262,144 | 8,192        | Mistral Medium 3.5; instelbare reasoning                        |
| `mistral/mistral-small-latest`   | tekst, beeld | 128,000 | 16,384       | Mistral Small 4; instelbare reasoning via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | tekst, beeld | 128,000 | 32,768       | Pixtral                                                         |
| `mistral/codestral-latest`       | tekst       | 256,000 | 4,096        | Coderen                                                         |
| `mistral/devstral-medium-latest` | tekst       | 262,144 | 32,768       | Devstral 2                                                      |
| `mistral/magistral-small`        | tekst       | 128,000 | 40,000       | Reasoning ingeschakeld                                          |

Smoke-test na onboarding Medium 3.5 zonder de Gateway te starten:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

Om de gebundelde catalogusrij te bekijken voordat je de configuratie wijzigt:

```bash
openclaw models list --all --provider mistral --plain
```

## Audiotranscriptie (Voxtral)

Gebruik Voxtral voor batch-audiotranscriptie via de pijplijn voor mediabegrip.

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
Het mediatranscriptiepad gebruikt `/v1/audio/transcriptions`. Het standaardaudiomodel voor Mistral is `voxtral-mini-latest`.
</Tip>

## Voice Call streaming STT

De gebundelde `mistral`-Plugin registreert Voxtral Realtime als streaming-STT-provider
voor Voice Call.

| Instelling       | Configuratiepad                                                       | Standaard                               |
| ---------------- | --------------------------------------------------------------------- | --------------------------------------- |
| API-sleutel      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Valt terug op `MISTRAL_API_KEY`         |
| Model            | `...mistral.model`                                                    | `voxtral-mini-transcribe-realtime-2602` |
| Codering         | `...mistral.encoding`                                                 | `pcm_mulaw`                             |
| Samplefrequentie | `...mistral.sampleRate`                                               | `8000`                                  |
| Doelvertraging   | `...mistral.targetStreamingDelayMs`                                   | `800`                                   |

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
OpenClaw stelt Mistral realtime STT standaard in op `pcm_mulaw` bij 8 kHz, zodat Voice Call
Twilio-mediaframes rechtstreeks kan doorsturen. Gebruik `encoding: "pcm_s16le"` en een
bijpassende `sampleRate` alleen als je upstream-stream al raw PCM is.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Instelbare reasoning">
    `mistral/mistral-small-latest` (Mistral Small 4) en `mistral/mistral-medium-3-5` ondersteunen [instelbare reasoning](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) op de Chat Completions API via `reasoning_effort` (`none` minimaliseert extra denkwerk in de uitvoer; `high` toont volledige denksporen vóór het definitieve antwoord). Mistral raadt `reasoning_effort="high"` aan voor agentic- en code-usecases met Medium 3.5.

    OpenClaw koppelt het **thinking**-niveau van de sessie aan Mistrals API:

    | OpenClaw thinking-niveau                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    Combineer de reasoning-modus van Medium 3.5 niet met `temperature: 0`. De Mistral
    HTTP API weigert `reasoning_effort="high"` plus `temperature: 0` met een 400-
    respons. Laat temperatuur oningesteld zodat Mistral de standaard gebruikt, of volg
    de [aanbevolen instellingen voor Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    en gebruik `temperature: 0.7` voor hoge reasoning. Voor deterministische directe
    antwoorden zet je thinking uit/minimaal, zodat OpenClaw
    `reasoning_effort: "none"` verstuurt voordat je de temperatuur verlaagt.
    </Warning>

    Voorbeeld van modelspecifieke configuratie voor Medium 3.5-reasoning:

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
    Andere gebundelde Mistral-catalogusmodellen gebruiken deze parameter niet. Blijf `magistral-*`-modellen gebruiken wanneer je Mistrals native reasoning-first-gedrag wilt.
    </Note>

  </Accordion>

  <Accordion title="Geheugenembeddings">
    Mistral kan geheugenembeddings leveren via `/v1/embeddings` (standaardmodel: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth en basis-URL">
    - Mistral-auth gebruikt `MISTRAL_API_KEY` (Bearer-header).
    - De basis-URL van de provider is standaard `https://api.mistral.ai/v1` en accepteert de standaard OpenAI-compatibele chat-completions-requestvorm.
    - Het standaardmodel voor onboarding is `mistral/mistral-large-latest`.
    - Overschrijf de basis-URL onder `models.providers.mistral.baseUrl` alleen wanneer Mistral expliciet een regionale endpoint publiceert die je nodig hebt.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, model-refs en failover-gedrag kiezen.
  </Card>
  <Card title="Mediabegrip" href="/nl/nodes/media-understanding" icon="microphone">
    Instellen van audiotranscriptie en providerselectie.
  </Card>
</CardGroup>
