---
read_when:
    - Vuoi utilizzare i modelli Mistral in OpenClaw
    - Vuoi la trascrizione in tempo reale di Voxtral per Chiamata vocale
    - Ti servono l'onboarding della chiave API Mistral e i riferimenti ai modelli
summary: Utilizzare i modelli Mistral e la trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-10T19:49:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw include un Plugin Mistral in bundle che registra quattro contratti: completamenti chat, comprensione dei media (trascrizione batch Voxtral), STT in tempo reale per Voice Call (Voxtral Realtime) ed embedding di memoria (`mistral-embed`).

| Proprietà        | Valore                                      |
| ---------------- | ------------------------------------------- |
| ID provider      | `mistral`                                   |
| Plugin           | in bundle, `enabledByDefault: true`         |
| Variabile env di autenticazione | `MISTRAL_API_KEY`              |
| Flag di onboarding | `--auth-choice mistral-api-key`           |
| Flag CLI diretto | `--mistral-api-key <key>`                   |
| API              | compatibile con OpenAI (`openai-completions`) |
| URL di base      | `https://api.mistral.ai/v1`                 |
| Modello predefinito | `mistral/mistral-large-latest`           |
| Modello di embedding | `mistral-embed`                         |
| Batch Voxtral    | `voxtral-mini-latest` (trascrizione audio) |
| Realtime Voxtral | `voxtral-mini-transcribe-realtime-2602`     |

## Primi passi

<Steps>
  <Step title="Get your API key">
    Crea una chiave API nella [Console Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Oppure passa direttamente la chiave:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catalogo LLM integrato

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
è l'attuale modello Medium combinato nel catalogo in bundle: 128B di pesi densi,
input di testo e immagini, contesto 256K, function calling, output strutturato, coding
e ragionamento regolabile tramite l'API Chat Completions. Usa
`mistral/mistral-medium-3-5` quando vuoi il modello agentic/coding unificato
più recente di Mistral invece del predefinito `mistral/mistral-large-latest`.

OpenClaw attualmente distribuisce questo catalogo Mistral in bundle:

| Rif. modello                     | Input       | Contesto | Output max | Note                                                             |
| -------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | testo, immagine | 262,144 | 16,384 | Modello predefinito                                             |
| `mistral/mistral-medium-2508`    | testo, immagine | 262,144 | 8,192  | Mistral Medium 3.1                                              |
| `mistral/mistral-medium-3-5`     | testo, immagine | 262,144 | 8,192  | Mistral Medium 3.5; ragionamento regolabile                     |
| `mistral/mistral-small-latest`   | testo, immagine | 128,000 | 16,384 | Mistral Small 4; ragionamento regolabile tramite API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | testo, immagine | 128,000 | 32,768 | Pixtral                                                         |
| `mistral/codestral-latest`       | testo        | 256,000 | 4,096      | Coding                                                           |
| `mistral/devstral-medium-latest` | testo        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | testo        | 128,000 | 40,000     | Con ragionamento abilitato                                       |

Dopo l'onboarding, esegui uno smoke test di Medium 3.5 senza avviare il Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

Per consultare la riga del catalogo in bundle prima di modificare la configurazione:

```bash
openclaw models list --all --provider mistral --plain
```

## Trascrizione audio (Voxtral)

Usa Voxtral per la trascrizione audio batch tramite la pipeline di comprensione
dei media.

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

Il Plugin `mistral` in bundle registra Voxtral Realtime come provider STT
in streaming per Voice Call.

| Impostazione  | Percorso di configurazione                                          | Predefinito                             |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Chiave API   | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Usa come fallback `MISTRAL_API_KEY`     |
| Modello      | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codifica     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Frequenza di campionamento | `...mistral.sampleRate`                                   | `8000`                                  |
| Ritardo target | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

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
OpenClaw imposta lo STT realtime Mistral su `pcm_mulaw` a 8 kHz per consentire a Voice Call
di inoltrare direttamente i frame multimediali Twilio. Usa `encoding: "pcm_s16le"` e un
`sampleRate` corrispondente solo se il tuo flusso upstream è già PCM grezzo.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Adjustable reasoning">
    `mistral/mistral-small-latest` (Mistral Small 4) e `mistral/mistral-medium-3-5` supportano il [ragionamento regolabile](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) sull'API Chat Completions tramite `reasoning_effort` (`none` minimizza il pensiero aggiuntivo nell'output; `high` espone tracce di pensiero complete prima della risposta finale). Mistral consiglia `reasoning_effort="high"` per i casi d'uso agentic e di codice con Medium 3.5.

    OpenClaw mappa il livello di **thinking** della sessione all'API di Mistral:

    | Livello di thinking OpenClaw                       | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    Non combinare la modalità di ragionamento di Medium 3.5 con `temperature: 0`. L'API
    HTTP di Mistral rifiuta `reasoning_effort="high"` più `temperature: 0` con una risposta
    400. Lascia la temperatura non impostata affinché Mistral usi il valore predefinito, oppure segui
    le [impostazioni consigliate per Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    e usa `temperature: 0.7` per il ragionamento alto. Per risposte dirette deterministiche,
    disattiva il thinking o impostalo su minimal affinché OpenClaw invii
    `reasoning_effort: "none"` prima di abbassare la temperatura.
    </Warning>

    Esempio di configurazione con ambito modello per il ragionamento di Medium 3.5:

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
    Gli altri modelli del catalogo Mistral in bundle non usano questo parametro. Continua a usare i modelli `magistral-*` quando vuoi il comportamento nativo di Mistral orientato prima al ragionamento.
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral può fornire embedding di memoria tramite `/v1/embeddings` (modello predefinito: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - L'autenticazione Mistral usa `MISTRAL_API_KEY` (header Bearer).
    - L'URL di base del provider è predefinito su `https://api.mistral.ai/v1` e accetta la forma di richiesta chat-completions standard compatibile con OpenAI.
    - Il modello predefinito di onboarding è `mistral/mistral-large-latest`.
    - Sovrascrivi l'URL di base sotto `models.providers.mistral.baseUrl` solo quando Mistral pubblica esplicitamente un endpoint regionale di cui hai bisogno.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Media understanding" href="/it/nodes/media-understanding" icon="microphone">
    Configurazione della trascrizione audio e selezione del provider.
  </Card>
</CardGroup>
