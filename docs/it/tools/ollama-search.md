---
read_when:
    - Vuoi usare Ollama per `web_search`
    - Vuoi un provider `web_search` senza chiave API
    - Hai bisogno di indicazioni per la configurazione di Ollama Web Search
summary: Ricerca web Ollama tramite il tuo host Ollama configurato
title: Ricerca web Ollama
x-i18n:
    generated_at: "2026-04-24T09:07:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw supporta **Ollama Web Search** come provider bundled `web_search`.
Usa l'API sperimentale di ricerca web di Ollama e restituisce risultati strutturati
con titoli, URL e snippet.

A differenza del provider di modelli Ollama, questa configurazione non richiede
una chiave API per impostazione predefinita. Richiede però:

- un host Ollama raggiungibile da OpenClaw
- `ollama signin`

## Configurazione

<Steps>
  <Step title="Avvia Ollama">
    Assicurati che Ollama sia installato e in esecuzione.
  </Step>
  <Step title="Accedi">
    Esegui:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Scegli Ollama Web Search">
    Esegui:

    ```bash
    openclaw configure --section web
    ```

    Poi seleziona **Ollama Web Search** come provider.

  </Step>
</Steps>

Se usi già Ollama per i modelli, Ollama Web Search riutilizza lo stesso
host configurato.

## Configurazione

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Override facoltativo dell'host Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Se non è impostato alcun URL base Ollama esplicito, OpenClaw usa `http://127.0.0.1:11434`.

Se il tuo host Ollama si aspetta auth bearer, OpenClaw riutilizza
`models.providers.ollama.apiKey` (o la corrispondente auth del provider basata su env)
anche per le richieste di web-search.

## Note

- Per questo provider non è richiesto alcun campo chiave API specifico per web-search.
- Se l'host Ollama è protetto da auth, OpenClaw riutilizza la normale
  chiave API del provider Ollama quando presente.
- OpenClaw avvisa durante la configurazione se Ollama non è raggiungibile o non è autenticato, ma
  non blocca la selezione.
- L'auto-rilevamento a runtime può ripiegare su Ollama Web Search quando non è configurato alcun provider con credenziali di priorità più alta.
- Il provider usa l'endpoint sperimentale `/api/experimental/web_search`
  di Ollama.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e l'auto-rilevamento
- [Ollama](/it/providers/ollama) -- configurazione del modello Ollama e modalità cloud/local
