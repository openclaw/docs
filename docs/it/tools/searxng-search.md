---
read_when:
    - Vuoi un provider di web search self-hosted
    - Vuoi usare SearXNG per `web_search`
    - Ti serve un'opzione di ricerca incentrata sulla privacy o isolata in air-gap
summary: Web search SearXNG -- provider meta-search self-hosted senza chiave
title: Ricerca SearXNG
x-i18n:
    generated_at: "2026-04-24T09:08:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw supporta [SearXNG](https://docs.searxng.org/) come provider `web_search` **self-hosted,
senza chiave**. SearXNG è un motore meta-search open-source
che aggrega risultati da Google, Bing, DuckDuckGo e altre fonti.

Vantaggi:

- **Gratuito e illimitato** -- non richiede API key né abbonamento commerciale
- **Privacy / air-gap** -- le query non escono mai dalla tua rete
- **Funziona ovunque** -- nessuna restrizione regionale delle API di ricerca commerciali

## Configurazione

<Steps>
  <Step title="Avvia un'istanza SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Oppure usa qualsiasi deployment SearXNG esistente a cui hai accesso. Vedi la
    [documentazione di SearXNG](https://docs.searxng.org/) per la configurazione in produzione.

  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    # Seleziona "searxng" come provider
    ```

    Oppure imposta la variabile d'ambiente e lascia che l'auto-rilevamento la trovi:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Configurazione

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Impostazioni a livello Plugin per l'istanza SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // facoltativo
            language: "en", // facoltativo
          },
        },
      },
    },
  },
}
```

Il campo `baseUrl` accetta anche oggetti SecretRef.

Regole di trasporto:

- `https://` funziona per host SearXNG pubblici o privati
- `http://` è accettato solo per host trusted private-network o loopback
- gli host SearXNG pubblici devono usare `https://`

## Variabile d'ambiente

Imposta `SEARXNG_BASE_URL` come alternativa alla configurazione:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Quando `SEARXNG_BASE_URL` è impostata e non è configurato alcun provider esplicito, l'auto-rilevamento
seleziona automaticamente SearXNG (alla priorità più bassa -- qualsiasi provider supportato da API con una
chiave configurata ha la precedenza).

## Riferimento configurazione Plugin

| Campo        | Descrizione                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL base della tua istanza SearXNG (obbligatorio)                  |
| `categories` | Categorie separate da virgole come `general`, `news` o `science`   |
| `language`   | Codice lingua per i risultati come `en`, `de` o `fr`              |

## Note

- **API JSON** -- usa l'endpoint nativo `format=json` di SearXNG, non scraping HTML
- **Nessuna API key** -- funziona subito con qualsiasi istanza SearXNG
- **Validazione URL base** -- `baseUrl` deve essere un URL `http://` o `https://`
  valido; gli host pubblici devono usare `https://`
- **Ordine di auto-rilevamento** -- SearXNG viene controllato per ultimo (ordine 200) nell'
  auto-rilevamento. I provider supportati da API con chiavi configurate vengono eseguiti prima, poi
  DuckDuckGo (ordine 100), poi Ollama Web Search (ordine 110)
- **Self-hosted** -- controlli l'istanza, le query e i motori di ricerca upstream
- **Categories** è predefinito a `general` quando non configurato

<Tip>
  Per far funzionare l'API JSON di SearXNG, assicurati che la tua istanza SearXNG abbia il formato `json`
  abilitato nel suo `settings.yml` sotto `search.formats`.
</Tip>

## Correlati

- [Panoramica Web Search](/it/tools/web) -- tutti i provider e auto-rilevamento
- [DuckDuckGo Search](/it/tools/duckduckgo-search) -- un altro fallback senza chiave
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con piano gratuito
