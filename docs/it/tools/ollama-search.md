---
read_when:
    - Vuoi usare Ollama per web_search
    - Vuoi un provider web_search senza chiave
    - Vuoi usare Ollama Web Search ospitato con OLLAMA_API_KEY
    - Ti serve una guida alla configurazione di Ollama Web Search
summary: Ricerca web Ollama tramite un host Ollama locale o l'API Ollama ospitata
title: Ricerca web di Ollama
x-i18n:
    generated_at: "2026-06-27T18:22:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw supporta **Ollama Web Search** come provider `web_search` in bundle. Usa l'API di ricerca web di Ollama e restituisce risultati strutturati con titoli, URL e snippet.

Per Ollama locale o self-hosted, questa configurazione non richiede una chiave API per impostazione predefinita. Richiede invece:

- un host Ollama raggiungibile da OpenClaw
- `ollama signin`

Per la ricerca hosted diretta, imposta l'URL base del provider Ollama su `https://ollama.com` e fornisci una vera `OLLAMA_API_KEY`.

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

Se usi già Ollama per i modelli, Ollama Web Search riutilizza lo stesso host configurato.

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

Override opzionale dell'host Ollama:

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

Se configuri già Ollama come provider di modelli, il provider di ricerca web può invece riutilizzare quell'host:

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

Il provider di modelli Ollama usa `baseUrl` come chiave canonica. Il provider di ricerca web rispetta anche `baseURL` in `models.providers.ollama` per compatibilità con gli esempi di configurazione in stile OpenAI SDK.

Se non è impostato alcun URL base Ollama esplicito, OpenClaw usa `http://127.0.0.1:11434`.

Se il tuo host Ollama richiede autenticazione bearer, OpenClaw riutilizza `models.providers.ollama.apiKey` (o l'autenticazione del provider corrispondente basata su variabili d'ambiente) per le richieste a quell'host configurato.

Ollama Web Search hosted diretto:

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

## Note

- Per questo provider non è richiesto alcun campo di chiave API specifico per la ricerca web.
- Se l'host Ollama è protetto da autenticazione, OpenClaw riutilizza la normale chiave API del provider Ollama quando presente.
- Se `baseUrl` è `https://ollama.com`, OpenClaw chiama direttamente `https://ollama.com/api/web_search` e invia la chiave API Ollama configurata come autenticazione bearer.
- Se l'host configurato non espone la ricerca web e `OLLAMA_API_KEY` è impostato, OpenClaw può ripiegare su `https://ollama.com/api/web_search` senza inviare quella chiave di ambiente all'host locale.
- OpenClaw avvisa durante la configurazione se Ollama non è raggiungibile o non è stato effettuato l'accesso, ma non blocca la selezione.
- OpenClaw non seleziona automaticamente Ollama Web Search quando non è configurato alcun provider con credenziali a priorità più alta; sceglilo esplicitamente con `tools.web.search.provider: "ollama"`.
- Gli host del daemon Ollama locale usano l'endpoint proxy locale `/api/experimental/web_search`, che firma e inoltra a Ollama Cloud.
- Gli host `https://ollama.com` usano direttamente l'endpoint hosted pubblico `/api/web_search` con autenticazione tramite chiave API bearer.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Ollama](/it/providers/ollama) -- configurazione dei modelli Ollama e modalità cloud/locali
