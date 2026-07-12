---
read_when:
    - Vuoi usare Ollama per web_search
    - Vuoi un provider web_search senza chiave
    - Vuoi utilizzare Ollama Web Search in hosting con OLLAMA_API_KEY
    - Hai bisogno di indicazioni per configurare Ollama Web Search
summary: Ricerca web di Ollama tramite un host Ollama locale o l’API Ollama ospitata
title: Ricerca web di Ollama
x-i18n:
    generated_at: "2026-07-12T07:34:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw supporta **Ollama Web Search** come provider `web_search` integrato,
restituendo titoli, URL ed estratti dall'API di ricerca web di Ollama.

Per impostazione predefinita, Ollama locale/auto-ospitato non richiede una chiave API; sono necessari un host
Ollama raggiungibile e `ollama signin`. La ricerca ospitata diretta (senza Ollama locale) richiede
`baseUrl: "https://ollama.com"` e una chiave `OLLAMA_API_KEY` reale.

## Configurazione

<Steps>
  <Step title="Avvia Ollama">
    Assicurati che Ollama sia installato e in esecuzione.
  </Step>
  <Step title="Accedi">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Scegli Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    Seleziona **Ollama Web Search** come provider.

  </Step>
</Steps>

Se usi già Ollama per i modelli, Ollama Web Search riutilizza lo stesso
host configurato.

<Note>
  OpenClaw non seleziona mai automaticamente Ollama Web Search al posto di un provider
  con credenziali a priorità più alta; devi sceglierlo esplicitamente con
  `tools.web.search.provider: "ollama"`.
</Note>

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

Sostituzione facoltativa dell'host, limitata esclusivamente alla ricerca web:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

In alternativa, riutilizza l'host già configurato per il provider di modelli Ollama:

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

`models.providers.ollama.baseUrl` è la chiave canonica; il provider di ricerca web
accetta anche `baseURL` in tale posizione per compatibilità con gli esempi di configurazione
in stile OpenAI SDK. Se non è impostato nulla, OpenClaw usa per impostazione predefinita
`http://127.0.0.1:11434`.

Ollama Web Search ospitato diretto (senza Ollama locale):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Autenticazione e instradamento delle richieste

- Non esiste un campo per la chiave API specifico per la ricerca web; il provider riutilizza
  `models.providers.ollama.apiKey` (o l'autenticazione corrispondente del provider basata su variabili d'ambiente)
  quando l'host configurato è protetto da autenticazione.
- Ordine di risoluzione dell'host: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (o `baseURL`) → `http://127.0.0.1:11434`.
- Se l'host risolto è `https://ollama.com`, OpenClaw chiama
  direttamente `https://ollama.com/api/web_search` usando la chiave API per l'autenticazione
  bearer.
- In caso contrario, OpenClaw chiama prima l'endpoint proxy locale
  `/api/experimental/web_search` (che firma e inoltra la richiesta a Ollama
  Cloud), quindi, in caso di errore, ripiega su `/api/web_search` sullo stesso host. Se entrambi falliscono
  e `OLLAMA_API_KEY` è impostata, esegue un solo nuovo tentativo verso
  `https://ollama.com/api/web_search` con tale chiave, senza inviarla
  all'host locale.
- Durante la configurazione, OpenClaw mostra un avviso se Ollama non è raggiungibile o non è autenticato, ma
  non impedisce di selezionare il provider.

## Contenuti correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Ollama](/it/providers/ollama) -- configurazione dei modelli Ollama e modalità cloud/locale
