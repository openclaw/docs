---
read_when:
    - Vuoi usare Ollama per `web_search`
    - Vuoi un provider `web_search` senza chiave
    - Hai bisogno di indicazioni per la configurazione di Ollama Web Search
summary: Ollama Web Search tramite l'host Ollama configurato
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-05T14:07:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Ollama Web Search

OpenClaw supporta **Ollama Web Search** come provider `web_search` incluso.
Usa l'API sperimentale di ricerca web di Ollama e restituisce risultati strutturati
con titoli, URL e snippet.

A differenza del provider di modelli Ollama, questa configurazione non richiede
una chiave API per impostazione predefinita. Richiede invece:

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

    Quindi seleziona **Ollama Web Search** come provider.

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

Se non è impostato alcun URL di base Ollama esplicito, OpenClaw usa `http://127.0.0.1:11434`.

Se il tuo host Ollama richiede autenticazione bearer, OpenClaw riutilizza
anche `models.providers.ollama.apiKey` (o l'autenticazione del provider corrispondente supportata da env)
per le richieste di ricerca web.

## Note

- Per questo provider non è richiesto alcun campo specifico di chiave API per la ricerca web.
- Se l'host Ollama è protetto da autenticazione, OpenClaw riutilizza la normale
  chiave API del provider Ollama quando presente.
- Durante la configurazione OpenClaw avvisa se Ollama non è raggiungibile o se non è stato eseguito l'accesso, ma
  non blocca la selezione.
- Il rilevamento automatico a runtime può ripiegare su Ollama Web Search quando non è configurato alcun provider
  con credenziali a priorità più alta.
- Il provider usa l'endpoint sperimentale `/api/experimental/web_search`
  di Ollama.

## Correlati

- [Panoramica di Web Search](/tools/web) -- tutti i provider e il rilevamento automatico
- [Ollama](/it/providers/ollama) -- configurazione del modello Ollama e modalità cloud/locali
