---
read_when:
    - Vuoi usare i modelli Mistral in OpenClaw
    - Vuoi la trascrizione realtime Voxtral per Voice Call
    - Hai bisogno dell'onboarding della chiave API Mistral e dei model ref
summary: Usa i modelli Mistral e la trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-24T08:57:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw supporta Mistral sia per l'instradamento di modelli testo/immagine (`mistral/...`) sia per
la trascrizione audio tramite Voxtral nella comprensione multimediale.
Mistral può anche essere usato per gli embedding della memoria (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API nella [Console Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Oppure passa direttamente la chiave:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catalogo LLM integrato

OpenClaw attualmente include questo catalogo Mistral bundle:

| Model ref                        | Input       | Contesto | Output max | Note                                                             |
| -------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | testo, immagine | 262,144 | 16,384     | Modello predefinito                                              |
| `mistral/mistral-medium-2508`    | testo, immagine | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | testo, immagine | 128,000 | 16,384     | Mistral Small 4; reasoning regolabile tramite API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | testo, immagine | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | testo       | 256,000 | 4,096      | Coding                                                           |
| `mistral/devstral-medium-latest` | testo       | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | testo       | 128,000 | 40,000     | Reasoning abilitato                                              |

## Trascrizione audio (Voxtral)

Usa Voxtral per la trascrizione audio batch tramite la pipeline di
comprensione multimediale.

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
Il percorso di trascrizione dei media usa `/v1/audio/transcriptions`. Il modello audio predefinito per Mistral è `voxtral-mini-latest`.
</Tip>

## STT streaming Voice Call

Il Plugin bundle `mistral` registra Voxtral Realtime come provider
STT streaming per Voice Call.

| Impostazione | Percorso di configurazione                                               | Predefinito                            |
| ------------ | ------------------------------------------------------------------------ | -------------------------------------- |
| Chiave API   | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`   | Fallback a `MISTRAL_API_KEY`           |
| Modello      | `...mistral.model`                                                       | `voxtral-mini-transcribe-realtime-2602` |
| Codifica     | `...mistral.encoding`                                                    | `pcm_mulaw`                            |
| Sample rate  | `...mistral.sampleRate`                                                  | `8000`                                 |
| Ritardo target | `...mistral.targetStreamingDelayMs`                                    | `800`                                  |

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
OpenClaw usa per impostazione predefinita per l'STT realtime Mistral `pcm_mulaw` a 8 kHz in modo che Voice Call
possa inoltrare direttamente i frame multimediali di Twilio. Usa `encoding: "pcm_s16le"` e un
`sampleRate` corrispondente solo se il tuo stream upstream è già PCM raw.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Reasoning regolabile (mistral-small-latest)">
    `mistral/mistral-small-latest` corrisponde a Mistral Small 4 e supporta il [reasoning regolabile](https://docs.mistral.ai/capabilities/reasoning/adjustable) sulla Chat Completions API tramite `reasoning_effort` (`none` riduce al minimo il ragionamento extra nell'output; `high` mostra le tracce complete di thinking prima della risposta finale).

    OpenClaw mappa il livello di **thinking** della sessione all'API di Mistral:

    | Livello di thinking OpenClaw                    | `reasoning_effort` di Mistral |
    | ----------------------------------------------- | ----------------------------- |
    | **off** / **minimal**                           | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Gli altri modelli del catalogo Mistral bundle non usano questo parametro. Continua a usare i modelli `magistral-*` quando vuoi il comportamento nativo di Mistral orientato prima al reasoning.
    </Note>

  </Accordion>

  <Accordion title="Embedding della memoria">
    Mistral può servire embedding della memoria tramite `/v1/embeddings` (modello predefinito: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth e base URL">
    - L'auth Mistral usa `MISTRAL_API_KEY`.
    - La base URL del provider usa per impostazione predefinita `https://api.mistral.ai/v1`.
    - Il modello predefinito dell'onboarding è `mistral/mistral-large-latest`.
    - Z.AI usa autenticazione Bearer con la tua chiave API.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, model ref e comportamento di failover.
  </Card>
  <Card title="Comprensione multimediale" href="/it/nodes/media-understanding" icon="microphone">
    Configurazione della trascrizione audio e selezione del provider.
  </Card>
</CardGroup>
