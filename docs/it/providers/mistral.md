---
read_when:
    - Vuoi usare i modelli Mistral in OpenClaw
    - Desideri la trascrizione in tempo reale di Voxtral per Chiamata vocale
    - Ti servono l'onboarding della chiave API Mistral e i riferimenti ai modelli
summary: Utilizzare i modelli Mistral e la trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T09:06:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw include un Plugin Mistral integrato che registra quattro contratti: completamenti chat, comprensione dei media (trascrizione batch Voxtral), STT realtime per Voice Call (Voxtral Realtime) ed embedding di memoria (`mistral-embed`).

| Proprietà       | Valore                                      |
| ---------------- | ------------------------------------------- |
| ID provider      | `mistral`                                   |
| Plugin           | integrato, `enabledByDefault: true`         |
| Variabile env di autenticazione | `MISTRAL_API_KEY`          |
| Flag di onboarding | `--auth-choice mistral-api-key`           |
| Flag CLI diretto | `--mistral-api-key <key>`                   |
| API              | compatibile con OpenAI (`openai-completions`) |
| URL base         | `https://api.mistral.ai/v1`                 |
| Modello predefinito | `mistral/mistral-large-latest`           |
| Modello di embedding | `mistral-embed`                         |
| Batch Voxtral    | `voxtral-mini-latest` (trascrizione audio)  |
| Realtime Voxtral | `voxtral-mini-transcribe-realtime-2602`     |

## Per iniziare

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

OpenClaw attualmente distribuisce questo catalogo Mistral integrato:

| Riferimento modello             | Input       | Contesto | Output massimo | Note                                                             |
| -------------------------------- | ----------- | -------- | -------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | testo, immagine | 262,144 | 16,384     | Modello predefinito                                              |
| `mistral/mistral-medium-2508`    | testo, immagine | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | testo, immagine | 128,000 | 16,384     | Mistral Small 4; ragionamento regolabile tramite API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | testo, immagine | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | testo        | 256,000 | 4,096      | Coding                                                           |
| `mistral/devstral-medium-latest` | testo        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | testo        | 128,000 | 40,000     | Con ragionamento abilitato                                       |

## Trascrizione audio (Voxtral)

Usa Voxtral per la trascrizione audio batch tramite la pipeline di comprensione dei media.

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

Il Plugin `mistral` integrato registra Voxtral Realtime come provider STT in streaming per Voice Call.

| Impostazione | Percorso di configurazione                                           | Predefinito                            |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Chiave API   | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Ricade su `MISTRAL_API_KEY`             |
| Modello      | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codifica     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Frequenza di campionamento | `...mistral.sampleRate`                                  | `8000`                                  |
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
OpenClaw imposta per impostazione predefinita lo STT realtime Mistral su `pcm_mulaw` a 8 kHz, così Voice Call può inoltrare direttamente i frame multimediali Twilio. Usa `encoding: "pcm_s16le"` e un `sampleRate` corrispondente solo se lo stream upstream è già PCM grezzo.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Adjustable reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` corrisponde a Mistral Small 4 e supporta il [ragionamento regolabile](https://docs.mistral.ai/capabilities/reasoning/adjustable) nell'API Chat Completions tramite `reasoning_effort` (`none` riduce al minimo il pensiero extra nell'output; `high` espone le tracce complete di pensiero prima della risposta finale).

    OpenClaw mappa il livello di **pensiero** della sessione all'API di Mistral:

    | Livello di pensiero OpenClaw                       | `reasoning_effort` Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Gli altri modelli del catalogo Mistral integrato non usano questo parametro. Continua a usare i modelli `magistral-*` quando vuoi il comportamento nativo di Mistral orientato prima al ragionamento.
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
    - L'URL base del provider predefinito è `https://api.mistral.ai/v1` e accetta la forma di richiesta chat-completions standard compatibile con OpenAI.
    - Il modello predefinito di onboarding è `mistral/mistral-large-latest`.
    - Sovrascrivi l'URL base in `models.providers.mistral.baseUrl` solo quando Mistral pubblica esplicitamente un endpoint regionale di cui hai bisogno.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Media understanding" href="/it/nodes/media-understanding" icon="microphone">
    Configurazione della trascrizione audio e selezione del provider.
  </Card>
</CardGroup>
