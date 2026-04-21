---
read_when:
    - Vuoi usare i modelli Mistral in OpenClaw
    - Hai bisogno della procedura di onboarding della chiave API Mistral e dei riferimenti ai modelli
summary: Usa i modelli Mistral e la trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-21T08:28:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87d04e3d45c04280c90821b1addd87dd612191249836747fba27cde48b9890f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw supporta Mistral sia per il routing dei modelli testo/immagine (`mistral/...`) sia per la trascrizione audio tramite Voxtral nella comprensione dei media.
Mistral può essere usato anche per gli embedding della memoria (`memorySearch.provider = "mistral"`).

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

OpenClaw attualmente include questo catalogo Mistral bundled:

| Riferimento modello              | Input       | Contesto | Output massimo | Note                                                             |
| -------------------------------- | ----------- | -------- | -------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | testo, immagine | 262,144 | 16,384       | Modello predefinito                                              |
| `mistral/mistral-medium-2508`    | testo, immagine | 262,144 | 8,192        | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | testo, immagine | 128,000 | 16,384       | Mistral Small 4; ragionamento regolabile tramite API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | testo, immagine | 128,000 | 32,768       | Pixtral                                                          |
| `mistral/codestral-latest`       | testo       | 256,000 | 4,096          | Coding                                                           |
| `mistral/devstral-medium-latest` | testo       | 262,144 | 32,768         | Devstral 2                                                       |
| `mistral/magistral-small`        | testo       | 128,000 | 40,000         | Con ragionamento abilitato                                       |

## Trascrizione audio, Voxtral

Usa Voxtral per la trascrizione audio tramite la pipeline di comprensione dei media.

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

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Ragionamento regolabile (mistral-small-latest)">
    `mistral/mistral-small-latest` corrisponde a Mistral Small 4 e supporta il [ragionamento regolabile](https://docs.mistral.ai/capabilities/reasoning/adjustable) sull'API Chat Completions tramite `reasoning_effort` (`none` riduce al minimo il pensiero aggiuntivo nell'output; `high` mostra tracce complete di pensiero prima della risposta finale).

    OpenClaw mappa il livello di **thinking** della sessione all'API di Mistral:

    | Livello di thinking di OpenClaw                  | `reasoning_effort` di Mistral |
    | ------------------------------------------------ | ----------------------------- |
    | **off** / **minimal**                            | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`        |

    <Note>
    Gli altri modelli del catalogo Mistral bundled non usano questo parametro. Continua a usare i modelli `magistral-*` quando vuoi il comportamento nativo di Mistral orientato prima di tutto al ragionamento.
    </Note>

  </Accordion>

  <Accordion title="Embedding della memoria">
    Mistral può fornire embedding della memoria tramite `/v1/embeddings` (modello predefinito: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth e URL di base">
    - L'auth di Mistral usa `MISTRAL_API_KEY`.
    - L'URL di base del provider è predefinito su `https://api.mistral.ai/v1`.
    - Il modello predefinito dell'onboarding è `mistral/mistral-large-latest`.
    - Z.AI usa l'auth Bearer con la tua chiave API.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Comprensione dei media" href="/tools/media-understanding" icon="microphone">
    Configurazione della trascrizione audio e selezione del provider.
  </Card>
</CardGroup>
