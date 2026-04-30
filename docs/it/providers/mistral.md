---
read_when:
    - Vuoi usare i modelli Mistral in OpenClaw
    - Vuoi la trascrizione in tempo reale di Voxtral per le chiamate vocali
    - Sono necessari l'onboarding della chiave API Mistral e i riferimenti ai modelli
summary: Usa i modelli Mistral e la trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-30T09:09:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw supporta Mistral sia per il routing dei modelli testo/immagine (`mistral/...`) sia per
la trascrizione audio tramite Voxtral nella comprensione dei media.
Mistral può essere usato anche per gli embedding di memoria (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Autenticazione: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Primi passi

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

OpenClaw include attualmente questo catalogo Mistral in bundle:

| Riferimento modello              | Input       | Contesto | Output massimo | Note                                                              |
| -------------------------------- | ----------- | -------- | -------------- | ----------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384         | Modello predefinito                                               |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192          | Mistral Medium 3.1                                                |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384         | Mistral Small 4; reasoning regolabile tramite API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768         | Pixtral                                                           |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096          | Coding                                                            |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768         | Devstral 2                                                        |
| `mistral/magistral-small`        | text        | 128,000  | 40,000         | Con reasoning abilitato                                           |

## Trascrizione audio (Voxtral)

Usa Voxtral per la trascrizione audio in batch tramite la pipeline di
comprensione dei media.

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

## STT in streaming per Voice Call

Il Plugin `mistral` in bundle registra Voxtral Realtime come provider STT in
streaming per Voice Call.

| Impostazione   | Percorso di configurazione                                           | Predefinito                            |
| -------------- | -------------------------------------------------------------------- | -------------------------------------- |
| Chiave API     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Ripiega su `MISTRAL_API_KEY`           |
| Modello        | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602` |
| Codifica       | `...mistral.encoding`                                                | `pcm_mulaw`                            |
| Frequenza di campionamento | `...mistral.sampleRate`                                    | `8000`                                 |
| Ritardo target | `...mistral.targetStreamingDelayMs`                                  | `800`                                  |

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
OpenClaw imposta per impostazione predefinita lo STT realtime di Mistral su `pcm_mulaw` a 8 kHz, così Voice Call
può inoltrare direttamente i frame multimediali di Twilio. Usa `encoding: "pcm_s16le"` e un
`sampleRate` corrispondente solo se il tuo stream a monte è già PCM grezzo.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Reasoning regolabile (mistral-small-latest)">
    `mistral/mistral-small-latest` corrisponde a Mistral Small 4 e supporta il [reasoning regolabile](https://docs.mistral.ai/capabilities/reasoning/adjustable) sull'API Chat Completions tramite `reasoning_effort` (`none` riduce al minimo il pensiero extra nell'output; `high` mostra le tracce complete del pensiero prima della risposta finale).

    OpenClaw mappa il livello di **thinking** della sessione sull'API di Mistral:

    | Livello di thinking OpenClaw                       | `reasoning_effort` Mistral |
    | -------------------------------------------------- | -------------------------- |
    | **off** / **minimal**                              | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Gli altri modelli del catalogo Mistral in bundle non usano questo parametro. Continua a usare i modelli `magistral-*` quando vuoi il comportamento nativo di Mistral orientato prima al reasoning.
    </Note>

  </Accordion>

  <Accordion title="Embedding di memoria">
    Mistral può fornire embedding di memoria tramite `/v1/embeddings` (modello predefinito: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Autenticazione e URL base">
    - L'autenticazione Mistral usa `MISTRAL_API_KEY`.
    - L'URL base del provider è predefinito su `https://api.mistral.ai/v1`.
    - Il modello predefinito dell'onboarding è `mistral/mistral-large-latest`.
    - Z.AI usa l'autenticazione Bearer con la tua chiave API.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="Comprensione dei media" href="/it/nodes/media-understanding" icon="microphone">
    Configurazione della trascrizione audio e selezione del provider.
  </Card>
</CardGroup>
