---
read_when:
    - Vuoi usare Ollama per web_search
    - Vuoi un provider web_search senza chiave
    - Vuoi usare Ollama Web Search in hosting con OLLAMA_API_KEY
    - Ti serve una guida per configurare Ollama Web Search
summary: Ricerca web di Ollama tramite un host Ollama locale o l'API Ollama ospitata
title: Ricerca web di Ollama
x-i18n:
    generated_at: "2026-04-30T09:17:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw supporta **Ollama Web Search** come provider `web_search` incluso. Usa l'API di ricerca web di Ollama e restituisce risultati strutturati con titoli, URL e snippet.

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

Override facoltativo dell'host Ollama:

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

Se configuri già Ollama come provider di modelli, il provider di ricerca web può riutilizzare invece quell'host:

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

Il provider di modelli Ollama usa `baseUrl` come chiave canonica. Il provider di ricerca web rispetta anche `baseURL` su `models.providers.ollama` per compatibilità con gli esempi di configurazione in stile SDK OpenAI.

Se non è impostato alcun URL base esplicito per Ollama, OpenClaw usa `http://127.0.0.1:11434`.

Se il tuo host Ollama richiede autenticazione bearer, OpenClaw riutilizza `models.providers.ollama.apiKey` (o l'autenticazione del provider corrispondente basata su env) per le richieste a quell'host configurato.

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

- Per questo provider non è richiesto alcun campo chiave API specifico per la ricerca web.
- Se l'host Ollama è protetto da autenticazione, OpenClaw riutilizza la normale chiave API del provider Ollama quando presente.
- Se `baseUrl` è `https://ollama.com`, OpenClaw chiama direttamente `https://ollama.com/api/web_search` e invia la chiave API Ollama configurata come autenticazione bearer.
- Se l'host configurato non espone la ricerca web e `OLLAMA_API_KEY` è impostata, OpenClaw può eseguire il fallback a `https://ollama.com/api/web_search` senza inviare quella chiave env all'host locale.
- OpenClaw avvisa durante la configurazione se Ollama non è raggiungibile o se l'accesso non è stato effettuato, ma non blocca la selezione.
- Il rilevamento automatico a runtime può eseguire il fallback a Ollama Web Search quando non è configurato alcun provider con credenziali a priorità più alta.
- Gli host del daemon Ollama locale usano l'endpoint proxy locale `/api/experimental/web_search`, che firma e inoltra a Ollama Cloud.
- Gli host `https://ollama.com` usano direttamente l'endpoint hosted pubblico `/api/web_search` con autenticazione bearer tramite chiave API.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Ollama](/it/providers/ollama) -- configurazione del modello Ollama e modalità cloud/locali
