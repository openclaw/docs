---
read_when:
    - Vuoi usare i modelli Mistral in OpenClaw
    - Vuoi la trascrizione realtime Voxtral per Voice Call
    - Ti servono onboarding della chiave API Mistral e riferimenti dei modelli
summary: Usare modelli Mistral e trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T08:35:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw supporta Mistral sia per il routing dei modelli di testo/immagine (`mistral/...`) sia per
la trascrizione audio tramite Voxtral in media understanding.
Mistral può anche essere usato per gli embedding della memoria (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API nella [Mistral Console](https://console.mistral.ai/).
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

OpenClaw attualmente include questo catalogo Mistral:

| Model ref                        | Input       | Context | Max output | Note                                                             |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384     | Modello predefinito                                              |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384     | Mistral Small 4; ragionamento regolabile tramite API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096      | Coding                                                           |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000 | 40,000     | Con ragionamento abilitato                                       |

## Trascrizione audio (Voxtral)

Usa Voxtral per la trascrizione audio batch tramite la pipeline
media understanding.

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
Il percorso di trascrizione media usa `/v1/audio/transcriptions`. Il modello audio predefinito per Mistral è `voxtral-mini-latest`.
</Tip>

## STT in streaming per Voice Call

Il plugin `mistral` incluso registra Voxtral Realtime come provider STT
in streaming per Voice Call.

| Impostazione  | Percorso di configurazione                                             | Predefinito                             |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| Chiave API    | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Usa come fallback `MISTRAL_API_KEY`     |
| Modello       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codifica      | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Frequenza di campionamento | `...mistral.sampleRate`                                     | `8000`                                  |
| Ritardo target | `...mistral.targetStreamingDelayMs`                                   | `800`                                   |

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
OpenClaw imposta come predefinito per l'STT realtime di Mistral `pcm_mulaw` a 8 kHz così Voice Call
può inoltrare direttamente i frame media di Twilio. Usa `encoding: "pcm_s16le"` e una
`sampleRate` corrispondente solo se il tuo stream upstream è già PCM raw.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Ragionamento regolabile (mistral-small-latest)">
    `mistral/mistral-small-latest` corrisponde a Mistral Small 4 e supporta il [ragionamento regolabile](https://docs.mistral.ai/capabilities/reasoning/adjustable) sulla Chat Completions API tramite `reasoning_effort` (`none` riduce al minimo il ragionamento aggiuntivo nell'output; `high` mostra tracce di ragionamento complete prima della risposta finale).

    OpenClaw mappa il livello di **thinking** della sessione all'API di Mistral:

    | Livello di thinking di OpenClaw                  | `reasoning_effort` di Mistral |
    | ------------------------------------------------ | ----------------------------- |
    | **off** / **minimal**                            | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`        |

    <Note>
    Gli altri modelli del catalogo Mistral incluso non usano questo parametro. Continua a usare i modelli `magistral-*` quando vuoi il comportamento nativo di Mistral orientato prima di tutto al ragionamento.
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
    - L'autenticazione Mistral usa `MISTRAL_API_KEY`.
    - Il base URL del provider è predefinito su `https://api.mistral.ai/v1`.
    - Il modello predefinito dell'onboarding è `mistral/mistral-large-latest`.
    - Z.AI usa l'autenticazione Bearer con la tua chiave API.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei model ref e comportamento di failover.
  </Card>
  <Card title="Media understanding" href="/it/nodes/media-understanding" icon="microphone">
    Configurazione della trascrizione audio e selezione del provider.
  </Card>
</CardGroup>
