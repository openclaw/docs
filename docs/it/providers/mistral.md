---
read_when:
    - Vuoi utilizzare i modelli Mistral in OpenClaw
    - Vuoi la trascrizione in tempo reale di Voxtral per Voice Call
    - Hai bisogno dell'onboarding della chiave API di Mistral e dei riferimenti ai modelli
summary: Usa i modelli Mistral e la trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T07:25:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Il Plugin `mistral` incluso registra quattro contratti: completamenti chat, comprensione dei contenuti multimediali (trascrizione batch con Voxtral), STT in tempo reale per le chiamate vocali (Voxtral Realtime) ed embedding della memoria (`mistral-embed`).

| Proprietà       | Valore                                            |
| --------------- | ------------------------------------------------- |
| ID del provider | `mistral`                                         |
| Plugin          | incluso, abilitato per impostazione predefinita   |
| Variabile di ambiente per l'autenticazione | `MISTRAL_API_KEY`                 |
| Flag di configurazione iniziale | `--auth-choice mistral-api-key`              |
| Flag CLI diretto | `--mistral-api-key <key>`                         |
| API             | compatibile con OpenAI (`openai-completions`)     |
| URL di base     | `https://api.mistral.ai/v1`                       |
| Modello predefinito | `mistral/mistral-large-latest`                |
| Modello di embedding | `mistral-embed`                               |
| Voxtral batch   | `voxtral-mini-latest` (trascrizione audio)        |
| Voxtral in tempo reale | `voxtral-mini-transcribe-realtime-2602`    |

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API nella [console Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Esegui la configurazione iniziale">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    In alternativa, passa direttamente la chiave:

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

| Riferimento del modello           | Input         | Contesto | Output massimo | Note                                                          |
| --------------------------------- | ------------- | -------- | -------------- | ------------------------------------------------------------- |
| `mistral/mistral-large-latest`    | testo, immagine | 262,144 | 16,384         | Modello predefinito                                           |
| `mistral/mistral-medium-2508`     | testo, immagine | 262,144 | 8,192          | Mistral Medium 3.1                                            |
| `mistral/mistral-medium-3-5`      | testo, immagine | 262,144 | 8,192          | Mistral Medium 3.5; ragionamento regolabile                    |
| `mistral/mistral-small-latest`    | testo, immagine | 262,144 | 16,384         | Versione più recente di Mistral Small 4; `reasoning_effort` regolabile |
| `mistral/mistral-small-2603`      | testo, immagine | 262,144 | 16,384         | Versione bloccata di Mistral Small 4; `reasoning_effort` regolabile |
| `mistral/pixtral-large-latest`    | testo, immagine | 128,000 | 32,768         | Pixtral                                                       |
| `mistral/codestral-latest`        | testo         | 256,000  | 4,096          | Programmazione                                                 |
| `mistral/devstral-medium-latest`  | testo         | 262,144  | 32,768         | Devstral 2                                                    |
| `mistral/magistral-small`         | testo         | 128,000  | 40,000         | Ragionamento abilitato                                        |

Consulta la voce del catalogo incluso prima di modificare la configurazione:

```bash
openclaw models list --all --provider mistral --plain
```

Esegui una prova rapida di un modello senza avviare il Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Rispondi esattamente con: mistral-ok" \
  --json
```

## Trascrizione audio (Voxtral)

Usa Voxtral per la trascrizione batch dell'audio tramite la pipeline di comprensione dei contenuti multimediali:

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
Il percorso di trascrizione dei contenuti multimediali usa `/v1/audio/transcriptions`. Il modello audio predefinito per Mistral è `voxtral-mini-latest`.
</Tip>

## STT in streaming per le chiamate vocali

Il Plugin `mistral` incluso registra Voxtral Realtime come provider STT in streaming per le chiamate vocali.

| Impostazione       | Percorso di configurazione                                                | Valore predefinito                      |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------- |
| Chiave API         | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`    | Ripiega su `MISTRAL_API_KEY`            |
| Modello            | `...mistral.model`                                                        | `voxtral-mini-transcribe-realtime-2602` |
| Codifica           | `...mistral.encoding`                                                     | `pcm_mulaw`                             |
| Frequenza di campionamento | `...mistral.sampleRate`                                           | `8000`                                  |
| Ritardo di destinazione | `...mistral.targetStreamingDelayMs`                                   | `800`                                   |

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
Per impostazione predefinita, OpenClaw configura lo STT in tempo reale di Mistral su `pcm_mulaw` a 8 kHz, così le chiamate vocali possono inoltrare direttamente i frame multimediali di Twilio. Usa `encoding: "pcm_s16le"` e un valore `sampleRate` corrispondente solo se il flusso a monte è già in formato PCM non elaborato.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Ragionamento regolabile">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` e `mistral/mistral-medium-3-5` supportano il [ragionamento regolabile](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) nell'API Chat Completions tramite `reasoning_effort` (`none` riduce al minimo il ragionamento aggiuntivo nell'output; `high` mostra le tracce complete del ragionamento prima della risposta finale).

    OpenClaw associa il livello di **ragionamento** della sessione all'API di Mistral:

    | Livello di ragionamento di OpenClaw                                  | `reasoning_effort` di Mistral |
    | --------------------------------------------------------------------- | ----------------------------- |
    | **disattivato** / **minimo**                                          | `none`                        |
    | **basso** / **medio** / **alto** / **molto alto** / **adattivo** / **massimo** | `high`              |

    <Warning>
    Evita di combinare la modalità di ragionamento di Medium 3.5 con `temperature: 0`; è stato segnalato che l'API HTTP di Mistral rifiuta `reasoning_effort="high"` insieme a `temperature: 0` con una risposta 400. Non impostare la temperatura oppure disattiva il ragionamento o impostalo al minimo, affinché OpenClaw invii `reasoning_effort: "none"` prima di impostare una temperatura bassa.
    </Warning>

    Esempio di configurazione specifica per il modello per il ragionamento di Medium 3.5:

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
    Gli altri modelli del catalogo Mistral incluso non usano questo parametro. Continua a usare i modelli `magistral-*` quando desideri il comportamento nativo di Mistral incentrato innanzitutto sul ragionamento.
    </Note>

  </Accordion>

  <Accordion title="Embedding della memoria">
    Mistral può fornire embedding della memoria tramite `/v1/embeddings` (modello predefinito: `mistral-embed`):

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

  <Accordion title="Autenticazione e URL di base">
    - L'autenticazione di Mistral usa `MISTRAL_API_KEY` (intestazione Bearer).
    - L'URL di base del provider è `https://api.mistral.ai/v1` per impostazione predefinita e accetta il formato standard delle richieste di completamento chat compatibile con OpenAI.
    - Il modello predefinito della configurazione iniziale è `mistral/mistral-large-latest`.
    - Sovrascrivi l'URL di base in `models.providers.mistral.baseUrl` solo quando Mistral pubblica esplicitamente un endpoint regionale di cui hai bisogno.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Comprensione dei contenuti multimediali" href="/it/nodes/media-understanding" icon="microphone">
    Configurazione della trascrizione audio e selezione del provider.
  </Card>
</CardGroup>
